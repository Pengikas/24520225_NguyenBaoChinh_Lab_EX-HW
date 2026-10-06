# HW3 Task Decomposition

## Slice 1: Drift-Free Countdown Engine
- Use UTC ISO 8601 timestamps.
- Calculate remaining time from a fixed target timestamp.
- Avoid accumulating timer drift.
- Update the countdown periodically.

## Slice 2: State-Machine Form
- Implement Idle state.
- Implement Submitting state.
- Implement Success state.
- Implement Error state.
- Control UI transitions through explicit states.

## Slice 3: Double-Submit Prevention and Input Sanitization
- Prevent multiple form submissions.
- Disable submission while processing.
- Sanitize user input.
- Prevent unsafe HTML injection.
- Restore the form after success or error.

## Git Audit
- Minimum 5 atomic commits.
- Each commit should represent one logical change.
- Avoid one-shot implementation.