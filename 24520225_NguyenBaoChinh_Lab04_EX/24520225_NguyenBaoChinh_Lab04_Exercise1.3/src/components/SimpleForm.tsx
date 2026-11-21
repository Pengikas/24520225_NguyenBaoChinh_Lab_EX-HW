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
  category: 'event' | 'render' | 'effect';
  timestamp: string;
}

export interface RaceRequestEntry {
  seq: number;
  inputValue: string;
  delayMs: number;
  status: 'PENDING' | 'APPLIED' | 'STALE_OVERWROTE' | 'IGNORED_STALE';
  resultText: string;
  startedAt: string;
  completedAt?: string;
}

const DANGEROUS_INFINITE_LOOP_CODE = `// DANGEROUS PATTERN: Unstable object reference + unguarded setState in useEffect
useEffect(() => {
  setFormState({
    ...formState,
  });
}); // Missing or self-mutating dependency triggers after EVERY render!`;

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

export interface SimpleFormProps {
  onTraceUpdate?: (
    logs: TraceLogEntry[],
    metrics: {
      inputFieldRenders: number;
      simpleFormRenders: number;
      effectPassCount: number;
      lastKeystrokeValue: string;
    }
  ) => void;
}

export default function SimpleForm({ onTraceUpdate }: SimpleFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
  });

  const [validationErrors, setValidationErrors] = useState<FormErrors>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [childErrors, setChildErrors] = useState<FormErrors>({});
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  // Render & Effect counters displayed in UI
  const [observedMetrics, setObservedMetrics] = useState({
    inputFieldRenders: 1,
    simpleFormRenders: 1,
    effectPassCount: 0,
  });

  // Race Condition Functional Demo State (Mode A vs Mode B)
  const [raceMode, setRaceMode] = useState<'LEGACY' | 'PROTECTED'>('LEGACY');
  const [raceInput, setRaceInput] = useState<string>('');
  const [raceDisplayedResult, setRaceDisplayedResult] = useState<string>(
    'No async validation requests dispatched yet.'
  );
  const [raceCorrupted, setRaceCorrupted] = useState<boolean>(false);
  const [raceRequests, setRaceRequests] = useState<RaceRequestEntry[]>([]);

  const latestRaceSeqRef = useRef<number>(0);
  const traceLogsRef = useRef<TraceLogEntry[]>([]);
  const traceIdRef = useRef<number>(1);
  const inputRenderCountRef = useRef<number>(1);
  const formRenderCountRef = useRef<number>(1);
  const effectPassCountRef = useRef<number>(0);
  const lastKeystrokeRef = useRef<string>('a');

  const notifyTelemetry = useCallback(() => {
    setObservedMetrics({
      inputFieldRenders: inputRenderCountRef.current,
      simpleFormRenders: formRenderCountRef.current,
      effectPassCount: effectPassCountRef.current,
    });
    onTraceUpdate?.(traceLogsRef.current, {
      inputFieldRenders: inputRenderCountRef.current,
      simpleFormRenders: formRenderCountRef.current,
      effectPassCount: effectPassCountRef.current,
      lastKeystrokeValue: lastKeystrokeRef.current,
    });
  }, [onTraceUpdate]);

  const pushTraceStep = useCallback(
    (step: string, category: 'event' | 'render' | 'effect') => {
      if (category === 'effect') {
        effectPassCountRef.current += 1;
      }
      const now = new Date();
      const timestamp = now.toTimeString().split(' ')[0];
      const entry: TraceLogEntry = {
        id: traceIdRef.current++,
        step,
        category,
        timestamp,
      };
      traceLogsRef.current = [...traceLogsRef.current.slice(-24), entry];
      notifyTelemetry();
    },
    [notifyTelemetry]
  );

  const handleChildRender = useCallback(() => {
    inputRenderCountRef.current += 1;
  }, []);

  // Stable callback invoked by InputField useEffect #1: syncToParent()
  const handleValueChange = useCallback(
    (value: string) => {
      setSubmittedMessage(null);
      lastKeystrokeRef.current = value;
      formRenderCountRef.current += 1;
      pushTraceStep('SimpleForm render (parent state)', 'render');
      setFormData((previous) => ({
        ...previous,
        name: value,
      }));
    },
    [pushTraceStep]
  );

  // useEffect #2: validateField() (Intentional Legacy Anti-Pattern)
  useEffect(() => {
    console.log('useEffect #2: validateField()');
    pushTraceStep('useEffect #2: validateField()', 'effect');

    const nextErrors = validateField(formData);

    if (
      JSON.stringify(nextErrors) !==
      JSON.stringify(validationErrors)
    ) {
      formRenderCountRef.current += 1;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional Exercise 1.3 legacy validation anti-pattern demonstration
      setValidationErrors(nextErrors);
    }
  }, [formData, validationErrors, pushTraceStep]);

  // useEffect #3: calcFormValidity() (Intentional Legacy Anti-Pattern)
  useEffect(() => {
    console.log('useEffect #3: calcFormValidity()');
    pushTraceStep('useEffect #3: calcFormValidity()', 'effect');

    const nextValidity =
      Object.keys(validationErrors).length === 0 &&
      formData.name.trim().length >= 3;

    if (nextValidity !== isFormValid) {
      formRenderCountRef.current += 1;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional Exercise 1.3 legacy validation anti-pattern demonstration
      setIsFormValid(nextValidity);
    }
  }, [validationErrors, formData, isFormValid, pushTraceStep]);

  // useEffect #4: syncErrorsToChild() (Intentional Legacy Anti-Pattern)
  useEffect(() => {
    console.log('useEffect #4: syncErrorsToChild()');
    pushTraceStep('useEffect #4: syncErrorsToChild()', 'effect');

    if (
      JSON.stringify(validationErrors) !==
      JSON.stringify(childErrors)
    ) {
      pushTraceStep('InputField re-render (errors)', 'render');
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional Exercise 1.3 legacy validation anti-pattern demonstration
      setChildErrors(validationErrors);
    }
  }, [validationErrors, childErrors, pushTraceStep]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors = validateField(formData);

    if (Object.keys(errors).length === 0) {
      setSubmittedMessage(
        `Form submitted successfully for "${formData.name.trim()}"!`
      );
    } else {
      setSubmittedMessage(null);
      setValidationErrors(errors);
      setChildErrors(errors);
    }
  };

  // Dispatch an asynchronous validation request with variable latency
  // Short invalid strings (1-2 chars) take 700ms (slow network hop); valid strings (>=3 chars) take 150ms (fast cache hit)
  const dispatchAsyncValidation = (
    inputValue: string,
    mode: 'LEGACY' | 'PROTECTED',
    customDelayMs?: number
  ) => {
    const seq = ++latestRaceSeqRef.current;
    const trimmed = inputValue.trim();
    const delayMs =
      customDelayMs ?? (trimmed.length < 3 ? 700 : 150);
    const isValid = trimmed.length >= 3;
    const resultText = !trimmed
      ? 'INVALID: Name is required'
      : isValid
        ? `VALID: "${trimmed}" accepted`
        : `INVALID: "${trimmed}" must contain at least 3 characters`;

    const startedAt = new Date().toTimeString().split(' ')[0];

    const newReq: RaceRequestEntry = {
      seq,
      inputValue,
      delayMs,
      status: 'PENDING',
      resultText,
      startedAt,
    };

    setRaceRequests((prev) => [...prev.slice(-7), newReq]);

    setTimeout(() => {
      const completedAt = new Date().toTimeString().split(' ')[0];
      const isStale = seq < latestRaceSeqRef.current;

      if (mode === 'LEGACY') {
        // MODE A: Legacy Async Validation (No ordering protection — stale responses overwrite latest state!)
        setRaceDisplayedResult(
          `[Req #${seq} for "${inputValue}"] → ${resultText}`
        );
        setRaceCorrupted(isStale);
        setRaceRequests((prev) =>
          prev.map((r) =>
            r.seq === seq
              ? {
                  ...r,
                  status: isStale ? 'STALE_OVERWROTE' : 'APPLIED',
                  completedAt,
                }
              : r
          )
        );
      } else {
        // MODE B: Protected Validation (Checks sequence ID and ignores stale responses)
        if (isStale) {
          setRaceRequests((prev) =>
            prev.map((r) =>
              r.seq === seq
                ? {
                    ...r,
                    status: 'IGNORED_STALE',
                    completedAt,
                  }
                : r
            )
          );
        } else {
          setRaceDisplayedResult(
            `[Req #${seq} for "${inputValue}"] → ${resultText}`
          );
          setRaceCorrupted(false);
          setRaceRequests((prev) =>
            prev.map((r) =>
              r.seq === seq
                ? {
                    ...r,
                    status: 'APPLIED',
                    completedAt,
                  }
                : r
            )
          );
        }
      }
    }, delayMs);
  };

  const handleRaceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRaceInput(val);
    dispatchAsyncValidation(val, raceMode);
  };

  // Reproducible rapid-typing burst ("a" -> "ab" -> "abc") for current mode
  const runRapidTypingBurst = (targetMode: 'LEGACY' | 'PROTECTED') => {
    setRaceMode(targetMode);
    setRaceRequests([]);
    setRaceCorrupted(false);
    setRaceInput('abc');
    setRaceDisplayedResult(
      `Dispatched rapid typing burst ("a" → "ab" → "abc") in ${
        targetMode === 'LEGACY'
          ? 'MODE A: Legacy Async Validation'
          : 'MODE B: Protected Validation'
      }...`
    );

    // Keystroke 1: "a" (slow network: 650ms)
    dispatchAsyncValidation('a', targetMode, 650);
    // Keystroke 2: "ab" (medium network: 450ms)
    setTimeout(() => {
      dispatchAsyncValidation('ab', targetMode, 400);
    }, 30);
    // Keystroke 3: "abc" (fast response: 140ms)
    setTimeout(() => {
      dispatchAsyncValidation('abc', targetMode, 140);
    }, 60);
  };

  console.log('SimpleForm render');

  return (
    <div className="ex13-demos-column">
      {/* 1. Functional Demonstration: Cascading Re-renders Form */}
      <section
        className="ex13-form-card"
        aria-labelledby="legacy-form-heading"
      >
        <div className="ex13-card-header">
          <span className="ex13-panel-tag">
            1. CASCADING RE-RENDERS DEMONSTRATION
          </span>
          <h2 id="legacy-form-heading">Interactive Legacy Validation Form</h2>
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
            onChildRender={handleChildRender}
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
            Form Validity:{' '}
            <strong
              className={isFormValid ? 'ex13-valid' : 'ex13-invalid'}
              data-testid="form-validity-status"
            >
              {isFormValid ? 'Valid' : 'Invalid'}
            </strong>
          </div>
          <div>
            Parent State: <code>&quot;{formData.name}&quot;</code>
          </div>
          <div>
            Render Counter:{' '}
            <code>
              InputField={observedMetrics.inputFieldRenders} | SimpleForm=
              {observedMetrics.simpleFormRenders}
            </code>
          </div>
        </div>
      </section>

      {/* 2. Functional Demonstration: Race Conditions (Mode A vs Mode B) */}
      <section
        className="ex13-form-card"
        aria-labelledby="race-condition-heading"
      >
        <div className="ex13-card-header">
          <span className="ex13-panel-tag ex13-tag-cyan">
            2. RACE CONDITION DEMONSTRATION
          </span>
          <h2 id="race-condition-heading">
            Asynchronous Validation Race Condition Demo
          </h2>
          <p className="ex13-description">
            Short invalid inputs (<code>&quot;a&quot;</code>) take{' '}
            <code>650ms</code> to validate while valid 3+ character inputs (
            <code>&quot;abc&quot;</code>) resolve in <code>140ms</code>. Type
            rapidly or trigger a burst below to compare modes.
          </p>
        </div>

        <div className="ex13-mode-selector" role="group" aria-label="Validation Mode">
          <button
            type="button"
            className={
              raceMode === 'LEGACY'
                ? 'ex13-mode-btn ex13-mode-active-danger'
                : 'ex13-mode-btn'
            }
            onClick={() => {
              setRaceMode('LEGACY');
              setRaceCorrupted(false);
            }}
          >
            MODE A: Legacy Async Validation
          </button>

          <button
            type="button"
            className={
              raceMode === 'PROTECTED'
                ? 'ex13-mode-btn ex13-mode-active-safe'
                : 'ex13-mode-btn'
            }
            onClick={() => {
              setRaceMode('PROTECTED');
              setRaceCorrupted(false);
            }}
          >
            MODE B: Protected Validation
          </button>
        </div>

        <div className="ex13-race-controls">
          <div className="ex13-form-field">
            <label htmlFor="race-async-input" className="ex13-label">
              Rapid Typing Input ({raceMode === 'LEGACY' ? 'MODE A: Legacy' : 'MODE B: Protected'}):
            </label>
            <input
              id="race-async-input"
              type="text"
              className="ex13-input"
              value={raceInput}
              onChange={handleRaceInputChange}
              placeholder='Type "abc" quickly or click a rapid burst button...'
            />
          </div>

          <div className="ex13-burst-actions">
            <button
              type="button"
              className="ex13-sim-btn ex13-sim-btn-danger"
              onClick={() => runRapidTypingBurst('LEGACY')}
            >
              Run Rapid Typing in MODE A (Legacy)
            </button>
            <button
              type="button"
              className="ex13-sim-btn"
              onClick={() => runRapidTypingBurst('PROTECTED')}
            >
              Run Rapid Typing in MODE B (Protected)
            </button>
          </div>
        </div>

        <div
          className={
            raceCorrupted
              ? 'ex13-race-result ex13-race-result-corrupted'
              : 'ex13-race-result'
          }
          role="status"
          data-testid="race-result-banner"
        >
          <div>
            <strong>Current Input:</strong> <code>&quot;{raceInput}&quot;</code>
          </div>
          <div>
            <strong>Displayed Validation State:</strong>{' '}
            <span>{raceDisplayedResult}</span>
          </div>
          {raceCorrupted && (
            <div className="ex13-corruption-alert">
              🚨 STATE CORRUPTION DETECTED (MODE A): An older stale validation
              response resolved last and overwrote the valid result for{' '}
              <code>&quot;{raceInput}&quot;</code>!
            </div>
          )}
          {!raceCorrupted &&
            raceMode === 'PROTECTED' &&
            raceRequests.some((r) => r.status === 'IGNORED_STALE') && (
              <div className="ex13-protected-alert">
                ✓ STALE RESPONSES IGNORED (MODE B): Sequence ID guard discarded
                out-of-order responses so the latest input{' '}
                <code>&quot;{raceInput}&quot;</code> determines validation state.
              </div>
            )}
        </div>

        <div className="ex13-race-table-wrap">
          <table className="ex13-race-table">
            <thead>
              <tr>
                <th>Seq #</th>
                <th>Input</th>
                <th>Latency</th>
                <th>Start → Done</th>
                <th>Resolution Status</th>
              </tr>
            </thead>
            <tbody>
              {raceRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="ex13-live-empty">
                    No validation requests yet. Type above or click a burst
                    button.
                  </td>
                </tr>
              ) : (
                raceRequests.map((req) => (
                  <tr key={req.seq}>
                    <td>
                      <code>#{req.seq}</code>
                    </td>
                    <td>
                      <code>&quot;{req.inputValue}&quot;</code>
                    </td>
                    <td>{req.delayMs}ms</td>
                    <td>
                      {req.startedAt} → {req.completedAt ?? '...'}
                    </td>
                    <td>
                      <span
                        className={`ex13-status-badge ex13-status-${req.status.toLowerCase()}`}
                      >
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Functional Demonstration: Infinite Loop Risk (Non-Executing Isolated Fixture) */}
      <section
        className="ex13-form-card ex13-infinite-card"
        aria-labelledby="infinite-loop-heading"
      >
        <div className="ex13-card-header">
          <span className="ex13-panel-tag ex13-tag-danger">
            3. INFINITE LOOP RISK DEMONSTRATION
          </span>
          <h2 id="infinite-loop-heading">
            Infinite Loop Risk &amp; Maximum Update Depth Exceeded
          </h2>
        </div>

        <div className="ex13-safety-banner" role="note">
          ⚠ Demonstration only – intentionally unsafe code is not executed.
        </div>

        <pre className="ex13-code-fixture">
          <code>{DANGEROUS_INFINITE_LOOP_CODE}</code>
        </pre>

        <ul className="ex13-infinite-explanations">
          <li>
            <strong>Unstable Object References:</strong> Calling{' '}
            <code>setFormState(&#123; ...formState &#125;)</code> allocates a
            brand-new object reference in memory on every execution, even when
            the underlying field values are identical.
          </li>
          <li>
            <strong>State Updates Inside Effects:</strong> Because the effect
            calls <code>setFormState</code> unconditionally during the commit
            phase, React immediately schedules another render pass.
          </li>
          <li>
            <strong>Mutual State Dependencies &amp; Missing Guards:</strong>{' '}
            When <code>InputField</code> and <code>SimpleForm</code> synchronize
            state back and forth without a deep-equality guard or with a missing
            dependency array, each render re-runs the effect continuously until
            React halts execution with{' '}
            <code className="ex13-salmon-text">
              Uncaught Error: Maximum update depth exceeded
            </code>
            .
          </li>
        </ul>
      </section>
    </div>
  );
}
