# PROJECT_STRUCTURE.md

## Exercise 2: Reactive State Machine & Delegation Hub

**Course:** Web Application Development (Lab 02 — Exercise 2)  
**Deliverable:** Custom `useState` closure engine with atomic Git history, unidirectional data flow, root event delegation hub with zero orphan listeners, and focus-preserving reactive re-rendering.  
**Core Technologies:** Pure Vanilla ES6+ JavaScript, DOM Level 2/3 Event APIs, W3C Semantic HTML5, CSS3 Flexbox.

---

## 1. Directory Structure

```text
24520225_NguyenBaoChinh_Lab02_EX2/
├── index.html              # HTML host mounting container (#app) with responsive styling
├── mini_react.js           # Core reactive engine: useState, createRoot, renderApp, installDelegation, renderToDOM
├── app.js                  # Reactive Task Manager application component (TaskApp) with filters and controls
├── checkpoint2_verify.js   # Checkpoint 2 audit script verifying state mutation & button re-rendering
├── test_runner.js          # Automated security & mounting assertion suite (XSS, DOM integrity)
├── TASK_DECOMPOSITION.md   # 45-minute sprint breakdown, WBS phases, and atomic commit plan
├── AI_FAILURE_AUDIT.md     # In-depth code audit documenting 3 AI failure modes & mitigations
└── PROJECT_STRUCTURE.md    # Architecture map, file responsibilities, data contracts & constraints
```

---

## 2. File Responsibilities

| File | Responsibility | Key Exports / Elements | Design Constraints |
|---|---|---|---|
| `index.html` | Browser host page & test mounting environment | `<div id="app"></div>`, `<script type="module" src="./app.js">` | Minimal container markup; all application views are dynamically rendered by Mini-React |
| `mini_react.js` | Core reactive Virtual DOM & hook engine | `createElement()`, `createTextElement()`, `useState()`, `createRoot()`, `renderApp()`, `renderToDOM()` | Zero external dependencies; safe text node instantiation via `document.createTextNode()`; root event delegation |
| `app.js` | Reactive Task Manager application | `TaskApp()`, `addTask()`, `toggleTask()`, `deleteTask()`, `filters` | Multi-hook state management (`tasks`, `filter`, `input`); unidirectional data flow; semantic HTML |
| `checkpoint2_verify.js` | Checkpoint 2 audit & verification specification | `TaskApp` verification component, `useState(['Review PR', 'Verify AST'])` | Validates reactive state mutations, re-renders, and zero orphan button listeners |
| `test_runner.js` | Security assertions & DOM mounting verification | `vApp` VNode tree, XSS payload assertions, `console.assert` suite | Verifies XSS immunity against `<script>` and `<img>` vectors; verifies root rendering |
| `TASK_DECOMPOSITION.md` | Sprint breakdown and execution plan | 6-phase 45-minute sprint schedule, risk mitigation matrix | Prescribes atomic Git commits and Checkpoint 2 verification protocol |
| `AI_FAILURE_AUDIT.md` | Audit report of AI-generated defects | 3 AI failure modes: XSS injection, focus/caret drop, hook cursor drift | Documents reproduction steps, diagnostic methods, refactored solutions, and live defense guide |
| `PROJECT_STRUCTURE.md` | Architecture map & specifications | System architecture, data contracts, file mapping, verification commands | Single source of truth for repository structure and quality gates |

---

## 3. Architectural Specifications & Data Contracts

### 3.1 Hook State Store & Cursor Architecture (`useState`)

The reactive hook mechanism is implemented via an array-backed state store paired with an index cursor:

```typescript
// Memory Schema
const stateStore: any[] = [];
let stateCursor: number = 0;
```

#### State Lifecycle & Execution Rules:
1. **Slot Identification:** Each invocation of `useState(initialValue)` reads from and binds to `currentIndex = stateCursor`.
2. **First-Pass Allocation:** If `!(currentIndex in stateStore)`, the slot is initialized with `typeof initialValue === "function" ? initialValue() : initialValue`.
3. **Reactive Setter Closure (`setState`):**
   ```javascript
   function setState(nextValue) {
     stateStore[currentIndex] =
       typeof nextValue === "function"
         ? nextValue(stateStore[currentIndex])
         : nextValue;

     renderApp();
   }
   ```
4. **Deterministic Cursor Advancement:** Increments `stateCursor++` before returning `[stateStore[currentIndex], setState]`.
5. **Deterministic Cursor Reset:** At the beginning of every `renderApp()` call, `stateCursor` is strictly reset to `0`, ensuring that subsequent render passes retrieve state cells in the exact order declared.

---

### 3.2 Reactive Render & Focus Preservation Engine (`renderApp`)

The `renderApp` pipeline synchronizes the in-memory state with the browser DOM while preserving user input focus and cursor caret positions:

```text
+-----------------------------------------------------------------------------------------+
|                                REACTIVE RENDER PIPELINE                                 |
|                                                                                         |
| 1. Snapshot Active Element: (oldId = activeElement.dataset.vnodeId, start, end)         |
| 2. Reset Engine Cursors:   (stateCursor = 0, nodeId = 0, eventRegistry = new Map())     |
| 3. Execute Component Tree: (vnode = rootComponent())                                    |
| 4. Generate Real DOM:      (dom = renderToDOM(vnode))                                   |
| 5. Reconcile Container:    (rootElement.replaceChildren(dom))                           |
| 6. Restore Focus & Caret:  (replacement.focus(), replacement.setSelectionRange(s, e))   |
+-----------------------------------------------------------------------------------------+
```

---

### 3.3 Root Event Delegation Hub (`installDelegation`)

To satisfy the **Checkpoint: verify zero orphan event listeners attached to button children** constraint, no event listeners are directly attached to child buttons or inputs. Instead, event handling is centralized:

1. **Tagging Phase:** During `renderToDOM`, every interactive element receives a synthetic ID: `element.dataset.vnodeId = String(++nodeId)`.
2. **Registration Phase:** Event callbacks (`onClick`, `onInput`, `onChange`, `onSubmit`) are stored in a centralized map: `eventRegistry.set(id, handlers)`.
3. **Delegation Phase:** A single listener is attached to `rootElement` for `["click", "input", "change", "submit"]`.
4. **Bubble Dispatch:** When an event fires, the hub traverses ancestors from `event.target` to `rootElement`. If an ancestor possesses a `vnodeId` matching a registered handler for that event type, the callback is invoked and event propagation stops.

---

### 3.4 Task Manager State Schema & Component Model (`TaskApp`)

The Task Manager maintains three independent state slices:

```typescript
interface TaskItem {
  id: number;          // Unique timestamp identifier
  title: string;       // Task description
  completed: boolean;  // Completion status flag
}

type FilterMode = "ALL" | "ACTIVE" | "COMPLETED";

// State hooks declared in TaskApp:
const [tasks, setTasks] = useState<TaskItem[]>(...);
const [filter, setFilter] = useState<FilterMode>("ALL");
const [input, setInput] = useState<string>("");
```

- **Unidirectional Flow:** User interaction -> Trigger Delegated Event -> Invoke `setState(prev => ...)` -> Update `stateStore` -> Trigger `renderApp()` -> Re-render Virtual DOM -> Re-mount DOM -> Restore Focus.

---

## 4. Task Specifications & Quality Constraints

### 4.1 Checkpoint 2 Constraint: Zero Orphan Event Listeners
- **Specification:** No DOM element inside `#app` (such as `<button>` or `<input>`) may possess direct event listeners attached via `addEventListener`.
- **Enforcement:** All user interactions bubble to the delegation hub installed on `#app`.
- **Verification:** Chrome DevTools Elements panel -> Select button -> Event Listeners tab -> Verify `button` has 0 listeners; verify `#app` holds 1 delegated listener.

### 4.2 State Integrity & Cursor Synchronization
- **Specification:** State must survive repeated user interactions without array overflow or index drift.
- **Enforcement:** `stateCursor = 0` resets before every render. `setState` supports functional closures to prevent stale state bugs.

### 4.3 Focus & Caret Retention
- **Specification:** Continuous typing in the task input must operate at 60 FPS without caret jump or lost keystrokes.
- **Enforcement:** Pre-render snapshot of `document.activeElement.dataset.vnodeId` and `selectionStart/End`, followed by post-render query and `.setSelectionRange()`.

### 4.4 Semantic HTML & Accessibility
- **Specification:** Banned arbitrary `<div>` containers for layout wrappers.
- **Landmarks Used:** `<main className="app-container">`, `<header>`, `<form onSubmit={...}>`, `<nav aria-label="Filter tasks">`, `<section aria-label="Task list">`.
- **ARIA Attributes:** `aria-label`, `aria-pressed` for active filter button toggles.

### 4.5 XSS Immunity
- **Specification:** All string content rendered via Virtual DOM must be strictly safe from script injection.
- **Enforcement:** Text nodes are instantiated solely through `document.createTextNode(String(value))`.

---

## 5. Mandatory Git Milestone Commits

The exercise enforces an atomic Git history reflecting the architectural progression:

```text
3cb5741 feat(state): implement stateStore and resetCursor engine
25f33b7 feat(state): implement reactive useState dispatcher
2296fb0 feat(events): attach root event delegation listener
f9ff5e9 feat(ui): assemble reactive todo application
```

| Commit Message | Primary Scope & Changes |
|---|---|
| `feat(state): implement stateStore and resetCursor engine` | Introduces `stateStore` array, `stateCursor` tracking pointer, and reset logic in `renderApp()`. |
| `feat(state): implement reactive useState dispatcher` | Implements `useState(initialValue)` with closure over `currentIndex`, functional updater support, and `renderApp()` invocation. |
| `feat(events): attach root event delegation listener` | Installs centralized event delegation on `rootElement` for `click`, `input`, `change`, `submit` with `vnodeId` registry. |
| `feat(ui): assemble reactive todo application` | Builds the reactive Task Manager UI in `app.js` with task additions, toggles, deletions, dynamic filters, and focus retention. |

---

## 6. Verification & Quality Gates

Run the following checks to verify full compliance:

```bash
# 1. Open index.html in browser and verify Task Manager interactivity
# 2. Add task, toggle completion, toggle filters (ALL / ACTIVE / COMPLETED), delete task
# 3. Verify zero orphan listeners in DevTools on button elements
# 4. Run automated security test runner
# In browser DevTools Console:
import("./test_runner.js");
# Expected output:
# "✅ Checkpoint 1 & Security tests passed successfully!"
```
