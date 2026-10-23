# TASK_DECOMPOSITION.md

## Exercise 2: Reactive State Machine & Delegation Hub

**Course:** Web Application Development (Lab 02 — Exercise 2)  
**Project:** Reactive State Machine, Custom `useState`, and Root Event Delegation Hub  
**Sprint Duration:** 45-Minute In-Class Engineering Sprint  
**Deliverables:** Custom `useState` closure engine, zero orphan event listeners, root event delegation hub, focus-retentive reactive re-render pipeline, and atomic Git history with unidirectional data flow.

---

## 1. Sprint Overview & Objectives

The primary engineering goal of Exercise 2 is to design and implement a reactive state machine and unidirectional data flow from scratch in pure vanilla ES6+ JavaScript. The solution introduces a custom `useState` closure engine backed by a sequential cursor store and replaces element-level listener bindings with a centralized **Root Event Delegation Hub** on `#app`.

```text
+---------------------------------------------------------------------------------------------------+
|                                  IN-CLASS SPRINT 2 TIMELINE (45 MINS)                             |
|                                                                                                   |
| [00:00 - 05:00]  Phase 1: Architecture & Hook Memory Contract Setup                                |
| [05:00 - 15:00]  Phase 2: Task 1 - StateStore & Cursor Reset Engine (`stateStore`, `stateCursor`) |
| [15:00 - 25:00]  Phase 3: Task 2 - Reactive `useState` Dispatcher & Functional Update Pipeline    |
| [25:00 - 35:00]  Phase 4: Task 3 - Centralized Root Event Delegation Hub (`installDelegation`)     |
| [35:00 - 45:00]  Phase 5: Task 4 - Assemble Reactive Task Manager UI (`TaskApp` in `app.js`)      |
| [Post-Sprint]    Phase 6: Checkpoint 2 Verification, DevTools Audit & Git Atomic Commit Check     |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Work Breakdown Structure (WBS)

### Phase 1: Architecture & Hook Memory Contract Setup (Mins 00 – 05)
* **Goal:** Formalize the in-memory state storage schema, hook indexing rules, and unidirectional data flow constraints.
* **Component:** [mini_react.js](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Exercise/24520225_NguyenBaoChinh_Lab02_EX2/mini_react.js)
* **Detailed Specifications:**
  - Define `stateStore` as an immutable/persistent sequential array: `const stateStore = []`.
  - Define `stateCursor` tracking execution pointer: `let stateCursor = 0`.
  - Define root references: `let rootElement = null`, `let rootComponent = null`.
  - Establish event registry: `let eventRegistry = new Map()`, tracking synthetic node IDs (`nodeId`).

---

### Phase 2: Task 1 — Implement `stateStore` & `resetCursor` Engine (Mins 05 – 15)
* **Goal:** Build the sequential cursor infrastructure that preserves hook values across component re-executions while guaranteeing cursor deterministic resets.
* **Component:** [mini_react.js](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Exercise/24520225_NguyenBaoChinh_Lab02_EX2/mini_react.js)
* **Implementation Steps:**
  1. Initialize `stateStore = []` module-scoped array to hold multi-hook state cells.
  2. Implement cursor reset logic at the entry boundary of `renderApp()`:
     ```javascript
     stateCursor = 0;
     nodeId = 0;
     eventRegistry = new Map();
     ```
  3. Ensure that re-rendering re-executes `rootComponent()` from index 0, matching previous hook slots in stable sequence.
* **Git Milestone 1 (Mandatory Atomic Commit):**
  - **Commit Message:** `feat(state): implement stateStore and resetCursor engine`

---

### Phase 3: Task 2 — Implement Reactive `useState` Dispatcher (Mins 15 – 25)
* **Goal:** Create a custom `useState(initialValue)` hook that closes over its specific slot index, supports lazy initialization, accepts functional updaters, and triggers reactive re-renders.
* **Component:** [mini_react.js](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Exercise/24520225_NguyenBaoChinh_Lab02_EX2/mini_react.js)
* **Implementation Steps:**
  1. **Capture Slot Index:** Freeze current slot via `const currentIndex = stateCursor`.
  2. **Lazy Initialization:** If `!(currentIndex in stateStore)`, evaluate initial value (handling both static values and factory functions `initialValue()`).
  3. **State Setter Closure (`setState`):**
     - Support functional state updates: `typeof nextValue === "function" ? nextValue(stateStore[currentIndex]) : nextValue`.
     - Update slot value: `stateStore[currentIndex] = nextValue`.
     - Schedule/dispatch render cycle: invoke `renderApp()`.
  4. **Cursor Advancement:** Advance execution pointer via `stateCursor++`.
  5. **Return Tuple:** Return `[stateStore[currentIndex], setState]`.
* **Git Milestone 2 (Mandatory Atomic Commit):**
  - **Commit Message:** `feat(state): implement reactive useState dispatcher`

---

### Phase 4: Task 3 — Root Event Delegation Hub (`installDelegation`) (Mins 25 – 35)
* **Goal:** Eliminate orphan event listeners and listener bloat by anchoring all browser events to `rootElement`, resolving handler functions via `dataset.vnodeId`.
* **Component:** [mini_react.js](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Exercise/24520225_NguyenBaoChinh_Lab02_EX2/mini_react.js)
* **Implementation Steps:**
  1. **VNode ID Tagging:** During `renderToDOM(vnode)`, assign unique IDs to DOM elements: `element.dataset.vnodeId = String(++nodeId)`.
  2. **Event Registration:** Intercept props starting with `on*` (`onClick`, `onInput`, `onChange`, `onSubmit`). Extract event name (`name.slice(2).toLowerCase()`) and store in `eventRegistry.set(id, handlers)`. Do NOT call `element.addEventListener` on child nodes.
  3. **Install Delegation Hub (`installDelegation`):**
     - Attach listeners once to `rootElement` for `["click", "input", "change", "submit"]`.
     - Intercept `submit` events and call `event.preventDefault()`.
     - Traverse up the DOM tree from `event.target`:
       ```javascript
       while (target && target !== rootElement) {
         const id = target.dataset?.vnodeId;
         const handler = id ? eventRegistry.get(id)?.[eventType] : null;
         if (handler) {
           handler(event);
           return;
         }
         target = target.parentElement;
       }
       ```
* **Git Milestone 3 (Mandatory Atomic Commit):**
  - **Commit Message:** `feat(events): attach root event delegation listener`

---

### Phase 5: Task 4 — Assemble Reactive Task Manager UI (Mins 35 – 45)
* **Goal:** Compose the complete interactive Task Manager application demonstrating multiple hooks, dynamic filtering, CRUD actions, and input caret preservation.
* **Component:** [app.js](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Exercise/24520225_NguyenBaoChinh_Lab02_EX2/app.js)
* **Implementation Steps:**
  1. **Declare Multiple Hooks in `TaskApp()`:**
     - `tasks`: `useState([{ id: 1, title: "Review PR", completed: false }, { id: 2, title: "Verify AST", completed: false }])`
     - `filter`: `useState("ALL")` (`ALL`, `ACTIVE`, `COMPLETED`)
     - `input`: `useState("")` (controlled text input)
  2. **Implement Unidirectional Action Handlers:**
     - `addTask(event)`: Validates trimmed input, appends `{ id: Date.now(), title, completed: false }`, and resets input.
     - `toggleTask(id)`: Functional mapping toggling `completed` boolean.
     - `deleteTask(id)`: Filters out matching ID.
  3. **Semantic Hierarchy & Accessibility:**
     - Root `<main className="app-container">`
     - `<header>` displaying task count and remaining count.
     - `<form className="controls" onSubmit={addTask}>` with labeled text `<input>` and submit `<button>`.
     - `<nav className="filters">` with filter buttons toggling `aria-pressed`.
     - `<section aria-label="Task list">` containing `.task` rows with checkbox, title, and delete button.
  4. **Focus & Selection Retention Engine:**
     - Inside `renderApp()`, record `activeElement?.dataset?.vnodeId`, `selectionStart`, and `selectionEnd`.
     - Re-focus matching replacement node and restore caret ranges post-render.
* **Git Milestone 4 (Mandatory Atomic Commit):**
  - **Commit Message:** `feat(ui): assemble reactive todo application`

---

## 3. Checkpoint 2 Audit Verification Protocol

The verification script [checkpoint2_verify.js](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Exercise/24520225_NguyenBaoChinh_Lab02_EX2/checkpoint2_verify.js) and browser DevTools confirm all core constraints:

```javascript
// Checkpoint 2 Audit Specification:
import { useState, renderApp } from './mini_react.js';

function TaskApp() {
  const [tasks, setTasks] = useState(['Review PR', 'Verify AST']);
  const [filter, setFilter] = useState('ALL');

  return (
    <main className="app-container">
      <header><h2>Tasks: {tasks.length}</h2></header>
      <button onClick={() => setTasks([...tasks, `Task ${Date.now()}`])}>
        Add Task
      </button>
    </main>
  );
}
// Verification Criteria:
// 1. Button click triggers setTasks -> renderApp() re-renders tree with Tasks: 3.
// 2. Button DOM element has ZERO direct event listeners in Chrome DevTools Elements > Event Listeners.
// 3. Exactly one delegated listener exists on #app (rootElement).
```

### DevTools Inspection Checklist:
1. **Zero Orphan Listeners:** Select any `<button>` or `<input>` in Chrome DevTools Elements panel. Expand **Event Listeners** tab; verify **no direct listener** is attached. Verify ancestor `#app` holds delegated listeners.
2. **Caret Stability:** Focus input field, type rapidly; verify caret does not jump to end or drop focus.
3. **State Determinism:** Switch between filters (`ALL`, `ACTIVE`, `COMPLETED`); verify task states and counts update immediately without console warnings.

---

## 4. Risk Mitigation Matrix

| Identified Risk | Impact | Architectural Prevention Strategy |
|---|---|---|
| **State Cursor Drift** | Subsequent re-renders read wrong hook slots; state resets or crashes | Explicitly reset `stateCursor = 0` at the very start of `renderApp()`. |
| **Input Focus Dropping** | Keystrokes lost; user must re-click input after every letter | Snapshot active node's `vnodeId` and selection range; restore after `replaceChildren()`. |
| **Listener Memory Bloat** | Hundreds of abandoned DOM event listeners on re-render | Centralize in `rootElement` event delegation hub; clear `eventRegistry` each render. |
| **XSS Payload Injection** | User input executes malicious scripts | Primitive normalization to `TEXT_ELEMENT` and mounting via `document.createTextNode()`. |
| **Stale State Closures** | Rapid state updates overwrite each other | Implement functional updater pattern in `setState(previous => ...)`. |
