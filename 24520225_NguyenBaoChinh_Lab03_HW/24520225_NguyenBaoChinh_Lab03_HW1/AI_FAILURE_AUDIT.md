# AI FAILURE MODE AUDIT – PRODUCTION STUDIO DRUM KIT

**Student:** Nguyen Bao Chinh  
**Student ID:** 24520225  
**Assignment:** HW1 – Production Studio Drum Kit  
**Standard:** WCAG 2.2 AA

## 1. Audit Objective

Identify and mitigate potential defects introduced by AI-generated React and TypeScript code.

The audit focuses on keyboard reliability, browser event handling, audio playback, accessibility, and React lifecycle management.

## 2. Failure Mode Matrix

| ID | Failure Mode | Root Cause | Mitigation |
|---|---|---|---|
| R1 | Deprecated keyCode | AI uses obsolete keyboard APIs | Use KeyboardEvent.code |
| R2 | Vietnamese IME interference | AI relies on character-based key detection | Use physical key positions |
| R3 | Auto-repeat flood | Missing e.repeat guard | Ignore repeated keydown |
| R4 | Input shortcut interference | Global listener ignores target element | Exclude form controls and editable content |
| R5 | Event listener leak | Missing useEffect cleanup | Remove listener during cleanup |
| R6 | Unstable React state | Direct mutation of state | Use functional state updates |
| R7 | Missing active semantics | Missing aria-pressed | Bind active state to aria-pressed |
| R8 | Missing announcements | No accessible live region | Use aria-live="polite" |
| R9 | Audio initialization failure | Browser autoplay restrictions | Initialize AudioContext after user interaction |
| R10 | Inaccurate decibel claims | Simulated intensity treated as real dB | Label meter as estimated intensity |
| R11 | Insufficient contrast | Unverified color choices | Verify WCAG contrast ratios |
| R12 | Invisible focus | Missing focus-visible styling | Provide high-contrast focus indicators |
| R13 | Missing accessible names | Icon-only buttons | Provide descriptive aria-label |
| R14 | Motion accessibility | Uncontrolled animations | Respect prefers-reduced-motion |

## 3. Detailed Defect Analysis

### R1 – Deprecated Keyboard API

Potential AI defect:

```javascript
if (event.keyCode === 87) {
    triggerPad();
}
```

Problem:
- keyCode is deprecated.
- Keyboard behavior can depend on keyboard layout.

Mitigation:

```typescript
if (event.code === 'KeyW') {
    triggerPad();
}
```

Verification:
- Inspect event.code in Chrome DevTools.
- Search source code for keyCode and which.

### R2 – Auto-Repeat Flood

Potential AI defect:

```typescript
window.addEventListener('keydown', handleKeyDown);
```

Problem:
Holding a physical key can generate repeated keydown events.

Mitigation:

```typescript
if (event.repeat) return;
```

Verification:
Hold W and confirm that one physical press creates one hit event.

### R3 – Input Focus Interference

Potential AI defect:
Global keyboard shortcuts trigger while users type into forms.

Mitigation:

```typescript
const target = event.target;

if (target instanceof HTMLElement) {
    if (
        target.isContentEditable ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
    ) {
        return;
    }
}
```

Verification:
Type into a search input and confirm that no drum pad activates.

### R4 – Missing Event Cleanup

Potential AI defect:

```typescript
useEffect(() => {
    window.addEventListener('keydown', handler);
}, []);
```

Problem:
The listener is never removed.

Mitigation:

```typescript
useEffect(() => {
    window.addEventListener('keydown', handler);

    return () => {
        window.removeEventListener('keydown', handler);
    };
}, [handler]);
```

Verification:
Inspect the hook and verify that cleanup is returned.

### R5 – Missing Accessibility Semantics

Potential AI defect:

```jsx
<div onClick={playSound}>Kick</div>
```

Mitigation:

```tsx
<button
    type="button"
    aria-label="Kick Drum, W"
    aria-pressed={isActive}
>
    Kick
</button>
```

Verification:
Inspect Chrome Accessibility Tree and keyboard focus order.

### R6 – Misleading Volume Measurement

Potential AI defect:
Showing an arbitrary number and labeling it as a real decibel reading.

Mitigation:
Use an estimated intensity scale unless actual audio measurement and calibration are implemented.

## 4. Security and Reliability

- Do not use innerHTML for user-controlled content.
- Render text through React JSX.
- Do not mutate React state directly.
- Avoid unnecessary global event listeners.
- Handle unsupported browser audio capabilities.
- Avoid claiming unverified accessibility scores.

## 5. Verification Evidence

The following evidence must be collected after implementation:

1. Keyboard mapping screenshots.
2. Anti-repeat test.
3. Input focus isolation test.
4. Browser Console inspection.
5. Accessibility Tree inspection.
6. Hit History screenshot.
7. Volume Meter screenshot.
8. Responsive viewport screenshot.
9. Lighthouse Accessibility report.
10. Lighthouse Best Practices report.

## 6. Audit Status

The issues listed above are potential failure modes identified during planning.

They must not be marked as empirically reproduced or fixed until the corresponding implementation and verification have actually been completed.

Final audit findings will be updated after Phase 7.