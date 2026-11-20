import { useCallback, useState } from 'react';
import SimpleForm, { type TraceLogEntry } from '../components/SimpleForm';

export default function ValidationPage() {
  const [liveTrace, setLiveTrace] = useState<TraceLogEntry[]>([]);
  const [effectPassCount, setEffectPassCount] = useState<number>(0);

  const handleTraceUpdate = useCallback(
    (logs: TraceLogEntry[], passCount: number) => {
      setLiveTrace([...logs]);
      setEffectPassCount(passCount);
    },
    []
  );

  return (
    <div className="ex13-dashboard">
      <header className="ex13-header">
        <span className="ex13-badge">ANTI-PATTERN</span>
        <h1>Exercise 1.3: Legacy Validation Anti-Patterns</h1>
        <p className="ex13-subtitle">
          Deconstructing <span className="ex13-wavy">useEffect</span> Chaining Across{' '}
          <span className="ex13-wavy">InputField</span> &amp;{' '}
          <span className="ex13-wavy">SimpleForm</span>
        </p>
      </header>

      {/* Top 2-Column Architectural Spec Section matching Reference Image */}
      <div className="ex13-hero-grid">
        {/* Left Card: CRITICAL ARCHITECTURAL FLAWS */}
        <section
          className="ex13-flaws-window"
          aria-labelledby="critical-flaws-heading"
        >
          <div className="ex13-flaws-titlebar">
            <span className="ex13-cross-icon" aria-hidden="true">✕</span>
            <h2 id="critical-flaws-heading">CRITICAL ARCHITECTURAL FLAWS</h2>
          </div>

          <div className="ex13-flaws-body">
            <p className="ex13-flaws-intro">
              Chaining 5 useEffect Hooks in Form State:
            </p>

            <ul className="ex13-flaws-list">
              <li>
                <span className="ex13-flaw-title">Cascading Re-renders:</span>{' '}
                <strong>
                  State synchronizations between{' '}
                  <span className="ex13-cyan-text">InputField</span> and{' '}
                  <span className="ex13-cyan-text">SimpleForm</span> trigger up
                  to 5 redundant render cycles per keystroke.
                </strong>
              </li>

              <li>
                <span className="ex13-flaw-title">Race Conditions:</span>{' '}
                <strong>
                  Rapid user typing causes asynchronous effect updates to
                  resolve out of order, corrupting state.
                </strong>
              </li>

              <li>
                <span className="ex13-flaw-title">Infinite Loop Risk:</span>{' '}
                <strong>
                  Mutual state dependencies risk triggering React&apos;s{' '}
                  <span className="ex13-salmon-text">
                    Maximum update depth exceeded
                  </span>{' '}
                  exception.
                </strong>
              </li>
            </ul>
          </div>
        </section>

        {/* Right Card: macOS Terminal Window execution_trace.log */}
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
              [1] User Event: onChange(&apos;a&apos;)
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
              {'         '}├─► <span className="ex13-yellow">useEffect #2: validateField()</span>
            </div>

            <div className="ex13-term-line ex13-term-effect">
              {'         '}├─► <span className="ex13-yellow">useEffect #3: calcFormValidity()</span>
            </div>

            <div className="ex13-term-line ex13-term-effect">
              {'         '}└─► <span className="ex13-yellow">useEffect #4: syncErrorsToChild()</span>
            </div>

            <div className="ex13-term-line ex13-term-muted">
              {'             '}└─► InputField re-render (errors)
            </div>

            <div className="ex13-term-line ex13-term-effect">
              {'                 '}└─► <span className="ex13-yellow">useEffect #5: autoScrollToError()</span>
            </div>

            <hr className="ex13-term-divider" />

            <div className="ex13-term-alert-red">
              🚨 CASCADE DETECTED: 5 re-renders / 1 keypress
            </div>
            <div className="ex13-term-alert-orange">
              💥 Uncaught Error: Max update depth exceeded
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Section: Live Interactive Legacy Form & Real-time Hook Stream */}
      <div className="ex13-interactive-grid">
        <SimpleForm onTraceUpdate={handleTraceUpdate} />

        <section
          className="ex13-trace-panel"
          aria-labelledby="live-telemetry-heading"
        >
          <div className="ex13-trace-header">
            <div>
              <span className="ex13-panel-tag ex13-tag-cyan">
                LIVE TELEMETRY &amp; REACT BATCHING NOTE
              </span>
              <h2 id="live-telemetry-heading">
                Live Console &amp; Effect Stream
              </h2>
            </div>
            <span className="ex13-cascade-badge">
              Effect Passes: {effectPassCount}
            </span>
          </div>

          <div className="ex13-batching-note">
            <strong>Conceptual Trace vs. Actual React 19 Rendering:</strong>{' '}
            <code>execution_trace.log</code> illustrates the 5 chained{' '}
            <code>useEffect</code> dependency hops across{' '}
            <code>InputField</code> and <code>SimpleForm</code>. In React 19,
            automatic state batching combines synchronous state updates inside
            effects, while still executing all 5 effect callbacks shown below
            and in DevTools Console.
          </div>

          <div className="ex13-live-console">
            <div className="ex13-live-console-header">
              <span>Live Effect Hook Stream (execution_trace.log)</span>
              <span>Active</span>
            </div>
            <ul className="ex13-live-list">
              {liveTrace.length === 0 ? (
                <li className="ex13-live-empty">
                  Type in the Full Name input on the left to stream the 5
                  chained useEffect logs in real time...
                </li>
              ) : (
                liveTrace.slice(-10).map((item) => (
                  <li key={item.id}>
                    <span className="ex13-log-time">[{item.timestamp}]</span>{' '}
                    <span className="ex13-log-step">{item.step}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>
      </div>

      <footer className="ex13-slide-footer">
        LAB 4 // MULTI-ROUTE SPA ARCHITECTURE
      </footer>
    </div>
  );
}
