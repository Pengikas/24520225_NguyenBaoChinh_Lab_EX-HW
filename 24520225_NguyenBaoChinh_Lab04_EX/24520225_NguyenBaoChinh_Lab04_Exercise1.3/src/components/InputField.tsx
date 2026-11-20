import { useEffect, useRef, useState } from 'react';

export interface InputFieldProps {
  label: string;
  value: string;
  error?: string;
  onValueChange: (value: string) => void;
  onTraceStep?: (step: string) => void;
}

export default function InputField({
  label,
  value,
  error,
  onValueChange,
  onTraceStep,
}: InputFieldProps) {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // useEffect #1: Sync local state to parent
  useEffect(() => {
    console.log('useEffect #1: syncToParent()');
    onTraceStep?.('useEffect #1: syncToParent()');

    if (localValue !== value) {
      onValueChange(localValue);
    }
  }, [localValue, value, onValueChange, onTraceStep]);

  // useEffect #5: Automatically scroll to error
  useEffect(() => {
    console.log('useEffect #5: autoScrollToError()');
    onTraceStep?.('useEffect #5: autoScrollToError()');

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
          console.log(`User Event: onChange('${nextVal}')`);
          onTraceStep?.(`User Event: onChange('${nextVal}')`);
          onTraceStep?.('InputField render (local state)');
          setLocalValue(nextVal);
        }}
        placeholder="Enter full name (min 3 characters)..."
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'name-error' : undefined}
      />

      {error && (
        <p id="name-error" className="ex13-error-message" role="alert">
          <span className="ex13-error-icon" aria-hidden="true">⚠</span> {error}
        </p>
      )}
    </div>
  );
}
