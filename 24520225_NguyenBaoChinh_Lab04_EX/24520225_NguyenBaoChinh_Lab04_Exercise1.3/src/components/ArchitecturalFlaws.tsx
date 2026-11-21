export default function ArchitecturalFlaws() {
  return (
    <section
      className="ex13-flaws-window"
      aria-labelledby="critical-flaws-heading"
    >
      <div className="ex13-flaws-titlebar">
        <span className="ex13-cross-icon" aria-hidden="true">
          ✕
        </span>
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
              <span className="ex13-cyan-text">SimpleForm</span> trigger up to 5
              redundant render cycles per keystroke.
            </strong>
          </li>

          <li>
            <span className="ex13-flaw-title">Race Conditions:</span>{' '}
            <strong>
              Rapid user typing causes asynchronous effect updates to resolve
              out of order, corrupting state.
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
  );
}
