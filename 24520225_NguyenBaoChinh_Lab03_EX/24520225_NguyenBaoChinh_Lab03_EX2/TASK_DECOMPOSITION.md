# TASK_DECOMPOSITION.md

## Exercise 3: Resilient State Machine & Skeleton Loader

**Course:** Web Application Development (Lab 02 — Exercise 3)  
**Project:** Resilient State Machine, Asynchronous Lifecycle Manager & Skeleton Screen  
**Sprint Duration:** 45-Minute In-Class Engineering Sprint  
**Deliverables:** Robust 4-state lifecycle handling (`IDLE`, `LOADING`, `SUCCESS`, `ERROR`), race-condition-free async data pipeline, animated pulsing CSS skeleton screen, human-readable error fallback with retry connection button, and atomic Git milestone tracking.

---

## 1. Sprint Overview & Objectives

The primary engineering goal of Exercise 3 is to eliminate race conditions, unhandled exceptions, and inconsistent UI states during asynchronous operations in pure vanilla JavaScript without external libraries. The architecture enforces a deterministic **Finite State Machine (FSM)** with exactly four mutually exclusive states (`IDLE`, `LOADING`, `SUCCESS`, `ERROR`), introduces monotonic request sequence guards against out-of-order network responses, and provides polished visual feedback via accessible pulsing skeleton screens.

```text
+---------------------------------------------------------------------------------------------------+
|                                  IN-CLASS SPRINT 3 TIMELINE (45 MINS)                             |
|                                                                                                   |
| [00:00 - 05:00]  Phase 1: Architecture, Type Contracts & 4-State FSM Design (`ViewState<T>`)      |
| [05:00 - 15:00]  Phase 2: Task 1 - FSM Engine & Guarded Transitions (`state_machine.js`)          |
| [15:00 - 25:00]  Phase 3: Task 2 - Asynchronous Pipeline & Monotonic Race Condition Guard        |
| [25:00 - 35:00]  Phase 4: Task 3 - Pulsing CSS Skeleton Screen & Accessibility (`aria-busy`)      |
| [35:00 - 40:00]  Phase 5: Task 4 - Resilient Error Boundary & Idempotent "Retry Connection"      |
| [40:00 - 45:00]  Phase 6: Task 5 - Unified Component Integration & Git Milestone Commit           |
| [Post-Sprint]    Phase 7: Network Stress Testing (Slow 3G, Rapid Clicks) & DevTools Verification   |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Work Breakdown Structure (WBS)

### Phase 1: Architecture, Type Contracts & 4-State FSM Design (Mins 00 – 05)
* **Goal:** Define strict mathematical state definitions and the discriminated union schema for async view states.
* **Component:** [state_machine.js](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Exercise/24520225_NguyenBaoChinh_Lab02_EX3/state_machine.js) & [app.js](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Exercise/24520225_NguyenBaoChinh_Lab02_EX3/app.js)
* **Detailed Specifications:**
  - Define `ViewState<T>` contract:
    ```typescript
    type ViewState<T> =
      | { status: 'IDLE' }
      | { status: 'LOADING' }
      | { status: 'SUCCESS'; data: T }
      | { status: 'ERROR'; error: string };
    ```
  - State boundaries: Transitions cannot jump illegally between states without fulfilling payload constraints (e.g., `SUCCESS` must carry valid data arrays; `ERROR` must provide human-readable error messages).

---

### Phase 2: Task 1 — Implement FSM Engine & Guarded Transitions (Mins 05 – 15)
* **Goal:** Build the runtime state machine transition validator ensuring only valid states and validated payloads are processed.
* **Component:** [state_machine.js](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Exercise/24520225_NguyenBaoChinh_Lab02_EX3/state_machine.js)
* **Implementation Steps:**
  1. Freeze state constants:
     ```javascript
     export const STATES = Object.freeze({
       IDLE: "IDLE",
       LOADING: "LOADING",
       SUCCESS: "SUCCESS",
       ERROR: "ERROR"
     });
     ```
  2. Implement `createInitialState()` returning `{ status: STATES.IDLE }`.
  3. Implement `transition(stateOrNext, maybeNext)` validator:
     - Accept both `transition(nextState)` and `transition(currentState, nextState)` signatures.
     - Validate `nextState.status` against `STATES`.
     - In `SUCCESS`: Assert `Array.isArray(nextState.data)`; throw error on invalid data shape.
     - In `ERROR`: Normalize error message to string with fallback `"Unknown error"`.
     - Reject undeclared states by throwing explicit runtime exceptions.

---

### Phase 3: Task 2 — Asynchronous Pipeline & Monotonic Race Condition Guard (Mins 15 – 25)
* **Goal:** Implement simulated asynchronous data ingestion with artificial delay and random connection dropouts, safeguarded by monotonic sequence tracking.
* **Component:** [app.js](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Exercise/24520225_NguyenBaoChinh_Lab02_EX3/app.js)
* **Implementation Steps:**
  1. Construct `fetchFeed()` mock:
     - Simulate 1800ms network round-trip via `setTimeout`.
     - Introduce 30% artificial connection failure (`Math.random() < 0.3`) with `"Unable to connect. Please try again."`.
     - Return structured mock items `[{ id, title }]` upon resolution.
  2. Implement monotonic invocation counter `latestRequestId = 0`.
  3. Build `loadFeedData()` async handler:
     - Increment `const requestId = ++latestRequestId;`.
     - Immediately transition state to `{ status: STATES.LOADING }`.
     - Await `fetchFeed()`.
     - **Race Condition Safeguard:** Compare `requestId !== latestRequestId`. If superseded by a newer request dispatched during flight, abort immediately and discard result.
     - Settle state to `SUCCESS` or `ERROR` via `transition()`.

---

### Phase 4: Task 3 — Pulsing CSS Skeleton Screen & Accessibility (Mins 25 – 35)
* **Goal:** Eliminate Cumulative Layout Shift (CLS) and provide high-fidelity perceptual loading feedback.
* **Component:** [styles.css](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Exercise/24520225_NguyenBaoChinh_Lab02_EX3/styles.css) & [app.js](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Exercise/24520225_NguyenBaoChinh_Lab02_EX3/app.js)
* **Implementation Steps:**
  1. Render placeholder skeleton DOM structure when `feedState.status === STATES.LOADING`:
     - Three repeating `.skeleton-card` containers matching final card heights and margins.
     - Title placeholder (`.skeleton-title`, 60% width, 22px height).
     - Body line placeholder (`.skeleton-line`, 92% width, 14px height).
     - Short line placeholder (`.skeleton-short`, 45% width, 14px height).
  2. Implement high-performance CSS gradient sweep animation:
     ```css
     .skeleton {
       background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
       background-size: 200% 100%;
       animation: skeleton-pulse 1.4s ease-in-out infinite;
     }
     @keyframes skeleton-pulse {
       0% { background-position: 100% 0; }
       100% { background-position: -100% 0; }
     }
     ```
  3. Accessibility attributes:
     - Wrapper configured with `aria-label="Loading data"` and `aria-busy="true"`.
     - Respect user motion preferences via `@media (prefers-reduced-motion: reduce) { .skeleton { animation: none; } }`.

---

### Phase 5: Task 4 — Resilient Error Boundary & Idempotent Retry (Mins 35 – 40)
* **Goal:** Present actionable, non-cryptic error feedback and restore user agency via an instant retry trigger.
* **Component:** [app.js](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Exercise/24520225_NguyenBaoChinh_Lab02_EX3/app.js) & [styles.css](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Exercise/24520225_NguyenBaoChinh_Lab02_EX3/styles.css)
* **Implementation Steps:**
  1. Render `.error-panel` when `feedState.status === STATES.ERROR`.
  2. Assign W3C ARIA landmark: `role="alert"` for immediate screen-reader announcement.
  3. Display human-readable error string (`feedState.error`).
  4. Attach "Retry Connection" button (`.retry-btn`) wired to `loadFeedData`.
  5. Apply high-contrast red themed warning styling (`#ef4444`, border accent, hover elevation).

---

### Phase 6: Task 5 — Unified Integration & Git Milestone Commit (Mins 40 – 45)
* **Goal:** Integrate Exercise 2 (`Reactive Task Manager`) and Exercise 3 (`Resilient Data Feed`) under an interactive tabbed showcase, preserving strict React hook ordering invariants.
* **Component:** [app.js](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Exercise/24520225_NguyenBaoChinh_Lab02_EX3/app.js)
* **Implementation Steps:**
  1. Top-level unconditional hook registration:
     - `activeTab` ("ALL" | "EX2" | "EX3")
     - `tasks`, `filter`, `input` (Exercise 2)
     - `feedState` (Exercise 3)
  2. Implement sub-view renderers: `renderExercise2()` and `renderExercise3()`.
  3. Dual-view responsive grid in `styles.css` enabling side-by-side or isolated demonstration.
* **Git Milestone (Mandatory Commit):**
  - **Commit Message:** `feat(ui): implement multi-state data component with skeleton feedback`

---

## 3. Checkpoint 3 Audit Protocol & Verification Criteria

| Test ID | Verification Target | Action & Diagnostic Method | Expected Outcome |
| :---: | :--- | :--- | :--- |
| **CP3-1** | **Initial State** | Mount application at `index.html`. Inspect DOM via DevTools. | `feedState.status === 'IDLE'`; "Ready to load data feed." and "Load Data" button visible. |
| **CP3-2** | **Loading Transition & Skeleton** | Click "Load Data". | `status` switches to `'LOADING'`; 3 skeleton cards render with smooth pulsing animation; `aria-busy="true"` is set. |
| **CP3-3** | **Success Resolution** | Allow request to settle successfully without error. | `status` switches to `'SUCCESS'`; list of 3 feed articles renders with blue accent cards; "Refresh Data" button displayed. |
| **CP3-4** | **Error Fallback & Retry** | Trigger requests until simulated 30% dropout fires. | `status` switches to `'ERROR'`; `.error-panel` with `role="alert"` displays "Unable to connect..."; "Retry Connection" button ready. |
| **CP3-5** | **Race Condition Immunity** | Enable **Slow 3G** in Chrome DevTools. Click "Retry Connection" 3 times in rapid succession. | Console demonstrates superseded requests are dropped; UI updates strictly to the response of the latest request; no out-of-order overwrite. |
| **CP3-6** | **Motion Accessibility** | Emulate `prefers-reduced-motion: reduce` in DevTools Rendering panel. | Pulse animation stops cleanly; static placeholder gradients remain visible without jarring motion. |
| **CP3-7** | **Zero Memory Leaks** | Check Chrome DevTools Event Listeners on `#app`. | Zero orphan listeners created; Mini-React root event delegation routes all clicks cleanly. |

---

## 4. Risk Mitigation Matrix

| Technical Risk | Probability | Severity | Mitigation Strategy | Verification Protocol |
| :--- | :---: | :---: | :--- | :--- |
| **Network Race Condition** (Out-of-order promise settling) | High | Critical | Monotonic sequence token (`latestRequestId`). Ignore responses where `requestId !== latestRequestId`. | Simulate Slow 3G; rapid multi-click "Retry" stress test. |
| **Illegal State Transitions** (Corrupted or malformed payload) | Medium | High | Strict `transition()` validator enforcing typed states and `Array.isArray(data)` requirement. | Dispatch invalid object to `transition()` and assert immediate throw. |
| **Cumulative Layout Shift (CLS)** during data fetch | High | Medium | Skeleton cards dimensionally mirror feed cards (padding, height, border-radius). | Inspect DevTools Performance tab and check CLS score is 0. |
| **Accessibility Non-Conformance** | Medium | Medium | Use `aria-busy="true"`, `role="alert"`, descriptive button `aria-label`, and `prefers-reduced-motion`. | Audit via Chrome Lighthouse Accessibility suite (100% target). |
| **Hook Cursor Drift** (Conditional hook invocation) | Low | Critical | Place all `useState` calls at the top level of `App()` unconditionally before any early returns. | Switch between tabs and assert state cursor remains deterministic. |

---

## 5. Definition of Done (DoD) Checklist

- [x] State machine strictly adheres to four mutually exclusive states: `'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'`.
- [x] State transition helper throws on invalid status or non-array data payload.
- [x] Monotonic counter prevents stale asynchronous responses from overwriting newer state.
- [x] Animated skeleton placeholder renders during `'LOADING'` state with zero CLS.
- [x] Error panel renders with `role="alert"` and an interactive "Retry Connection" button.
- [x] Clean co-existence with Exercise 2 Task Manager under unified tabbed layout.
- [x] All security guarantees preserved (safe text nodes, zero XSS).
- [x] Mandatory Git Milestone commit logged: `feat(ui): implement multi-state data component with skeleton feedback`.
