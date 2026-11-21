import type { TraceLogEntry } from './SimpleForm';

export interface ExecutionTraceProps {
  liveTrace: TraceLogEntry[];
  inputFieldRenders: number;
  simpleFormRenders: number;
  effectPassCount: number;
  lastKeystrokeValue: string;
}

export default function ExecutionTrace({
  liveTrace,
  inputFieldRenders,
  simpleFormRenders,
  effectPassCount,
  lastKeystrokeValue,
}: ExecutionTraceProps) {
  const displayKey = lastKeystrokeValue || 'a';

  return (
    <section
      className="ex13-terminal-window"
      aria-labelledby="execution-trace-filename"
    >
      <div className="ex13-terminal-titlebar">
        <div className="ex13-traffic-lights" aria-hidden="true">
          <span className="ex13-dot ex13-dot-red" />
          <span className="ex13-dot ex13-dot-yellow" />
          <span className="ex13-dot ex13-dot-green" />
        </div>
        <span
          id="execution-trace-filename"
          className="ex13-terminal-filename"
        >
          execution_trace.log
        </span>
      </div>

      <div className="ex13-terminal-body">
        <div className="ex13-term-line">
          <span className="ex13-term-prompt">~ $</span>{' '}
          <span className="ex13-term-cmd">
            trace-render-cycle --target Ex1.6
          </span>
        </div>

        <div className="ex13-term-line ex13-term-event">
          [1] User Event: onChange(&apos;{displayKey}&apos;)
        </div>

        <div className="ex13-term-line ex13-term-muted">
          {' '}├─► InputField render (local state)
        </div>

        <div className="ex13-term-line ex13-term-effect">
          {' '}├─► <span className="ex13-yellow">useEffect #1: syncToParent()</span>
        </div>

        <div className="ex13-term-line ex13-term-muted">
          {'     '}└─► SimpleForm render (parent state)
        </div>

        <div className="ex13-term-line ex13-term-effect">
          {'         '}├─►{' '}
          <span className="ex13-yellow">useEffect #2: validateField()</span>
        </div>

        <div className="ex13-term-line ex13-term-effect">
          {'         '}├─►{' '}
          <span className="ex13-yellow">useEffect #3: calcFormValidity()</span>
        </div>

        <div className="ex13-term-line ex13-term-effect">
          {'         '}└─►{' '}
          <span className="ex13-yellow">useEffect #4: syncErrorsToChild()</span>
        </div>

        <div className="ex13-term-line ex13-term-muted">
          {'             '}└─► InputField re-render (errors)
        </div>

        <div className="ex13-term-line ex13-term-effect">
          {'                 '}└─►{' '}
          <span className="ex13-yellow">useEffect #5: autoScrollToError()</span>
        </div>

        <hr className="ex13-term-divider" />

        <div className="ex13-term-alert-red">
          🚨 CASCADE DETECTED: 5 re-renders / 1 keypress
        </div>
        <div className="ex13-term-alert-orange">
          💥 Uncaught Error: Max update depth exceeded
        </div>

        {/* Measured vs Conceptual Distinction & Actual Observed Runtime Stream */}
        <div className="ex13-measured-metrics">
          <div className="ex13-metric-pill">
            <span>Observed InputField Renders:</span>{' '}
            <strong data-testid="input-render-count">{inputFieldRenders}</strong>
          </div>
          <div className="ex13-metric-pill">
            <span>Observed SimpleForm Renders:</span>{' '}
            <strong data-testid="form-render-count">{simpleFormRenders}</strong>
          </div>
          <div className="ex13-metric-pill">
            <span>Observed Effect Hook Executions:</span>{' '}
            <strong data-testid="effect-pass-count">{effectPassCount}</strong>
          </div>
        </div>

        <div className="ex13-batching-note">
          <strong>Conceptual Architecture vs. Measured React Renders:</strong>{' '}
          The 5 chained hooks above represent the legacy effect-chaining
          architecture. Actual React 19 render counts vary because automatic
          batching groups synchronous state updates within the same tick and
          skips no-op state updates when errors or validity remain unchanged.
        </div>

        <div className="ex13-live-console">
          <div className="ex13-live-console-header">
            <span>Actual Observed Event Stream (execution_trace.log)</span>
            <span>{liveTrace.length} events recorded</span>
          </div>
          <ul className="ex13-live-list" data-testid="live-trace-list">
            {liveTrace.length === 0 ? (
              <li className="ex13-live-empty">
                Type in the Full Name input below to record actual render and
                useEffect events...
              </li>
            ) : (
              liveTrace.slice(-12).map((item) => (
                <li key={item.id}>
                  <span className="ex13-log-time">[{item.timestamp}]</span>{' '}
                  <span
                    className={
                      item.category === 'event'
                        ? 'ex13-log-event'
                        : item.category === 'render'
                          ? 'ex13-log-render'
                          : 'ex13-log-step'
                    }
                  >
                    {item.step}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
