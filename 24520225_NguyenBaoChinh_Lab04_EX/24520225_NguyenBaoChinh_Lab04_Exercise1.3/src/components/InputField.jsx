import { useEffect, useRef, useState } from 'react';

export default function InputField({
  label,
  value,
  error,
  onValueChange,
  onTraceStep,
  onChildRender,
}) {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    onChildRender?.();
  });

  // useEffect #1: syncToParent()
  useEffect(() => {
    console.log('useEffect #1: syncToParent()');
    onTraceStep?.('useEffect #1: syncToParent()', 'effect');

    if (localValue !== value) {
      onValueChange(localValue);
    }
  }, [localValue, value, onValueChange, onTraceStep]);

  // useEffect #5: autoScrollToError()
  useEffect(() => {
    console.log('useEffect #5: autoScrollToError()');
    onTraceStep?.('useEffect #5: autoScrollToError()', 'effect');

    if (error && inputRef.current) {
      inputRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [error, onTraceStep]);

  console.log('InputField render');

  return (
    <div className="ex13-form-field">
      <label htmlFor="full-name-input" className="ex13-label">
        {label}
      </label>

      <input
        ref={inputRef}
        id="full-name-input"
        type="text"
        className="ex13-input"
        value={localValue}
        onChange={(event) => {
          const nextVal = event.target.value;
          console.log(`[1] User Event: onChange('${nextVal}')`);
          onTraceStep?.(`[1] User Event: onChange('${nextVal}')`, 'event');
          onTraceStep?.('InputField render (local state)', 'render');
          setLocalValue(nextVal);
        }}
        placeholder="Enter full name (min 3 characters)..."
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'name-error' : undefined}
      />

      {error && (
        <p id="name-error" className="ex13-error-message" role="alert">
          <span className="ex13-error-icon" aria-hidden="true">
            ⚠
          </span>{' '}
          {error}
        </p>
      )}
    </div>
  );
}
