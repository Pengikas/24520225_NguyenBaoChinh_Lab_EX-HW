import { useCallback, useEffect, useRef, useState } from 'react';
import InputField from './InputField';

export interface FormData {
  name: string;
}

export interface FormErrors {
  name?: string;
}

export interface TraceLogEntry {
  id: number;
  step: string;
  timestamp: string;
}

function validateField(data: FormData): FormErrors {
  const errors: FormErrors = {};
  const trimmed = data.name.trim();

  if (!trimmed) {
    errors.name = 'Name is required';
  } else if (trimmed.length < 3) {
    errors.name = 'Name must contain at least 3 characters';
  }

  return errors;
}

interface SimpleFormProps {
  onTraceUpdate?: (logs: TraceLogEntry[], effectPassCount: number) => void;
}

export default function SimpleForm({ onTraceUpdate }: SimpleFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
  });

  const [validationErrors, setValidationErrors] = useState<FormErrors>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [childErrors, setChildErrors] = useState<FormErrors>({});
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  // Race Condition Sandbox state
  const [raceStatus, setRaceStatus] = useState<string>('Idle');
  const [raceLog, setRaceLog] = useState<string[]>([]);

  // Infinite Loop Risk Sandbox state
  const [loopSimLogs, setLoopSimLogs] = useState<string[]>([]);
  const [loopExceptionTriggered, setLoopExceptionTriggered] = useState(false);

  const traceLogsRef = useRef<TraceLogEntry[]>([]);
  const traceIdRef = useRef(1);
  const effectPassCountRef = useRef(0);

  const pushTraceStep = useCallback(
    (step: string) => {
      effectPassCountRef.current += 1;
      const now = new Date();
      const timestamp = now.toTimeString().split(' ')[0];
      const entry: TraceLogEntry = {
        id: traceIdRef.current++,
        step,
        timestamp,
      };
      traceLogsRef.current = [...traceLogsRef.current.slice(-19), entry];
      onTraceUpdate?.(traceLogsRef.current, effectPassCountRef.current);
    },
    [onTraceUpdate]
  );

  // Stable callback for InputField useEffect #1
  const handleValueChange = useCallback(
    (value: string) => {
      setSubmittedMessage(null);
      pushTraceStep('SimpleForm render (parent state)');
      setFormData((previous) => ({
        ...previous,
        name: value,
      }));
    },
    [pushTraceStep]
  );

  // useEffect #2: Validate field (Intentional Legacy Anti-Pattern)
  useEffect(() => {
    console.log('useEffect #2: validateField()');
    pushTraceStep('useEffect #2: validateField()');

    const nextErrors = validateField(formData);

    // Guard against unnecessary state updates
    if (
      JSON.stringify(nextErrors) !==
      JSON.stringify(validationErrors)
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional Exercise 1.3 legacy validation anti-pattern demonstration
      setValidationErrors(nextErrors);
    }
  }, [formData, validationErrors, pushTraceStep]);

  // useEffect #3: Calculate form validity (Intentional Legacy Anti-Pattern)
  useEffect(() => {
    console.log('useEffect #3: calcFormValidity()');
    pushTraceStep('useEffect #3: calcFormValidity()');

    const nextValidity =
      Object.keys(validationErrors).length === 0 &&
      formData.name.trim().length >= 3;

    if (nextValidity !== isFormValid) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional Exercise 1.3 legacy validation anti-pattern demonstration
      setIsFormValid(nextValidity);
    }
  }, [validationErrors, formData, isFormValid, pushTraceStep]);

  // useEffect #4: Synchronize errors to child (Intentional Legacy Anti-Pattern)
  useEffect(() => {
    console.log('useEffect #4: syncErrorsToChild()');
    pushTraceStep('useEffect #4: syncErrorsToChild()');

    if (
      JSON.stringify(validationErrors) !==
      JSON.stringify(childErrors)
    ) {
      pushTraceStep('InputField re-render (errors)');
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional Exercise 1.3 legacy validation anti-pattern demonstration
      setChildErrors(validationErrors);
    }
  }, [validationErrors, childErrors, pushTraceStep]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors = validateField(formData);

    if (Object.keys(errors).length === 0) {
      setSubmittedMessage(`Form submitted successfully for "${formData.name.trim()}"!`);
    } else {
      setSubmittedMessage(null);
      setValidationErrors(errors);
      setChildErrors(errors);
    }
  };

  // Reproducible Race Condition Demonstration (Out-of-order async validation)
  const triggerRaceConditionDemo = () => {
    setRaceStatus('Simulating rapid typing: "a" (invalid, 600ms delay) → "alex" (valid, 150ms delay)...');
    setRaceLog([
      '[0ms] User types "a" → Async validation #1 dispatched (takes 600ms)',
      '[50ms] User rapidly types "alex" → Async validation #2 dispatched (takes 150ms)',
    ]);

    // Fast valid response resolves first at 200ms
    setTimeout(() => {
      console.log('Race Demo: Request #2 ("alex") resolved FIRST -> Valid');
      setRaceLog((prev) => [
        ...prev,
        '[200ms] Request #2 ("alex") resolves FIRST → Form marked VALID (no errors)',
      ]);
    }, 200);

    // Slow stale invalid response resolves LAST at 600ms and overwrites valid state!
    setTimeout(() => {
      console.log('Race Demo: Stale Request #1 ("a") resolved LAST -> Overwrites state with error!');
      setRaceLog((prev) => [
        ...prev,
        '[600ms] STALE Request #1 ("a") resolves LAST → Overwrites valid state with error: "Name must contain at least 3 characters"!',
      ]);
      setRaceStatus('RACE CONDITION DETECTED: Stale validation for "a" overwrote valid state for "alex"!');
    }, 600);
  };

  // Safe, isolated Infinite Loop Risk Demonstration
  const triggerInfiniteLoopDemo = () => {
    console.warn(
      'Simulating unguarded mutual useEffect dependency (capped at 8 iterations to keep app responsive): Error: Maximum update depth exceeded.'
    );
    const simulatedSteps = [
      'Cycle 1: InputField useEffect #1 calls onValueChange() -> creates new object reference in SimpleForm',
      'Cycle 2: SimpleForm useEffect #2 runs setValidationErrors({...}) without deep-equality guard',
      'Cycle 3: SimpleForm useEffect #4 runs setChildErrors({...}) -> triggers InputField re-render',
      'Cycle 4: InputField re-renders -> unstable callback triggers useEffect #1 again',
      'Cycle 5..50: Mutual state updates repeat synchronously without converging...',
      'Uncaught Error: Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.',
    ];
    setLoopSimLogs(simulatedSteps);
    setLoopExceptionTriggered(true);
  };

  console.log('SimpleForm render');

  return (
    <section className="ex13-form-card" aria-labelledby="legacy-form-heading">
      <div className="ex13-card-header">
        <span className="ex13-panel-tag">INTERACTIVE SANDBOX</span>
        <h2 id="legacy-form-heading">Legacy Validation Form</h2>
        <p className="ex13-description">
          Demonstrating 5 chained <code>useEffect</code> hooks across{' '}
          <code>InputField</code> &amp; <code>SimpleForm</code>.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <InputField
          label="Full Name"
          value={formData.name}
          error={childErrors.name}
          onValueChange={handleValueChange}
          onTraceStep={pushTraceStep}
        />

        <div className="ex13-form-actions">
          <button
            type="submit"
            className="ex13-submit-btn"
            disabled={!isFormValid}
          >
            Submit Form
          </button>
        </div>
      </form>

      {submittedMessage && (
        <div className="ex13-success-banner" role="status">
          ✓ {submittedMessage}
        </div>
      )}

      <div className="ex13-form-status">
        <div>
          Status:{' '}
          <strong className={isFormValid ? 'ex13-valid' : 'ex13-invalid'}>
            {isFormValid ? 'Valid' : 'Invalid'}
          </strong>
        </div>
        <div>
          Parent Value: <code>&quot;{formData.name}&quot;</code>
        </div>
      </div>

      {/* Reproducible Demonstrations for Flaw #2 (Race Condition) & Flaw #3 (Infinite Loop Risk) */}
      <div className="ex13-simulators">
        <div className="ex13-sim-box">
          <div className="ex13-sim-header">
            <h3>Race Condition Simulator</h3>
            <button
              type="button"
              className="ex13-sim-btn"
              onClick={triggerRaceConditionDemo}
            >
              Simulate Out-of-Order Async Validation
            </button>
          </div>
          <p className="ex13-sim-status">{raceStatus}</p>
          {raceLog.length > 0 && (
            <ul className="ex13-sim-log">
              {raceLog.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="ex13-sim-box ex13-sim-danger">
          <div className="ex13-sim-header">
            <h3>Infinite Loop Risk Sandbox (Isolated)</h3>
            <button
              type="button"
              className="ex13-sim-btn ex13-sim-btn-danger"
              onClick={triggerInfiniteLoopDemo}
            >
              Demonstrate Maximum Update Depth Exceeded
            </button>
          </div>
          {loopExceptionTriggered && (
            <div className="ex13-exception-box" role="alert">
              <div className="ex13-exception-title">
                RUNTIME EXCEPTION (GUARD REMOVED SIMULATION)
              </div>
              <ul className="ex13-sim-log">
                {loopSimLogs.map((log, index) => (
                  <li key={index}>{log}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
