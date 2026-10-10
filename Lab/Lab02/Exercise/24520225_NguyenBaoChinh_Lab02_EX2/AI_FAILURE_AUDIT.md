# AI Failure Mode Audit Report (AI_FAILURE_AUDIT.md)

| Metadata | Details |
| :--- | :--- |
| **Student Name** | Nguyễn Bảo Chính |
| **Student ID (MSSV)** | 24520225 |
| **Course** | Web Application Development (CS212 / SE104) |
| **Project Workspace** | `24520225_NguyenBaoChinh_Lab02_EX3` |
| **Target Lab** | Lab 02: Mini React Engine, Reactive State & Resilient State Machine |
| **Report Date** | October 10, 2026 |
| **Audit Weight** | 15% Evaluation Component |

---

## Executive Summary

During the development and pairing process with generative AI models for **Lab 02 (Mini React Engine, Custom `useState`, and Resilient State Machine)**, three critical engineering defects were identified, diagnosed, and remediated before production readiness. 

This document details the defect description, diagnostic methodologies (DevTools inspection, DOM assertions, Git diff reviews), refactored solutions, and comprehensive line-by-line code defense guides for the **Live Defense (Vấn đáp)**.

---

## Audit Matrix Overview

| # | Defect Name | Affected Module | Root Cause | Diagnostic Tool | Verification |
| :-: | :--- | :--- | :--- | :--- | :--- |
| **1** | **XSS Injection via Naive String Element Rendering** | `mini_react.js` / `createElement` | AI used `innerHTML` / raw node evaluation without text node escaping | Git Diff (`36676ea`) & `test_runner.js` console assertions | Pass (`document.createTextNode`) |
| **2** | **Input Focus Loss & Caret Desynchronization on Reactive Re-render** | `mini_react.js` (`renderApp`) & `app.js` | Full container DOM replacement (`replaceChildren`) detached active input element on every keystroke | DevTools Console (`document.activeElement`) & Event Breakpoint | Pass (`dataset.vnodeId` focus & selection restoration) |
| **3** | **Async Race Condition & Out-of-Order Stale State Overwrite** | `app.js` (`loadFeedData`) & `state_machine.js` | AI generated naive un-sequenced async fetch allowing delayed responses to overwrite newer user actions | Network Throttling (Slow 3G) & Concurrent Promise Jitter | Pass (Monotonic `latestRequestId` guard) |

---

## Defect 1: XSS Vulnerability & Unescaped DOM Node Injection

### 1. Defect Description
In the initial implementation suggested by the AI for `mini_react.js`, child text elements and raw string props were either directly assigned using `element.innerHTML = child` or not strictly encapsulated into immutable DOM text nodes. 
- **Vulnerability**: If an attacker or untrusted dynamic data source provided a payload such as `<script>alert(1)</script>` or `<img src=x onerror="alert('XSS')">`, the browser engine parsed and executed the markup as executable HTML instead of inert text.
- **Impact**: Arbitrary JavaScript execution, session hijacking, and violation of the Lab security baseline.

### 2. Diagnostic Method
1. **Automated Security Checkpoint Test (`test_runner.js`)**:
   Constructed a synthetic virtual DOM tree with malicious script and error payloads:
   ```javascript
   const vApp = createElement('section', { id: 'security-test' }, '<script>alert(1)</script>');
   root.replaceChildren(renderToDOM(vApp));
   console.assert(root.querySelector('script') === null, 'XSS Vulnerability: <script> was parsed into DOM!');
   ```
2. **DevTools DOM & Breakpoint Inspection**:
   - Placed a breakpoint inside `renderToDOM(vnode)` at the child mounting loop.
   - Inspected the Elements panel in Chrome DevTools: observed that `<script>` nodes were actively appended to the live DOM tree when using the AI's naive string-handling routine.
3. **Git Diff Inspection**:
   Reviewed `git diff 36676ea` to identify where `innerHTML` or unescaped string injection was introduced.

### 3. Refactored Solution (Clean Engineering Fix)

#### ❌ AI-Generated Defective Code:
```javascript
// DEFECTIVE: Dangerous innerHTML / raw HTML parsing
export function renderToDOM(vnode) {
  if (typeof vnode === "string") {
    const span = document.createElement("span");
    span.innerHTML = vnode; // ⚠️ CRITICAL XSS RISK!
    return span;
  }
  // ...
}
```

#### ✅ Refactored & Verified Code in `mini_react.js`:
```javascript
// VERIFIED: Enforce immutable Text Nodes
export function createTextElement(value) {
  return {
    type: "TEXT_ELEMENT",
    props: { nodeValue: String(value) },
    children: []
  };
}

export function createElement(type, props, ...children) {
  return {
    type,
    props: props || {},
    children: children.flat().map(child =>
      typeof child === "string" || typeof child === "number"
        ? createTextElement(child)
        : child
    )
  };
}

export function renderToDOM(vnode) {
  if (vnode == null || typeof vnode === "boolean") {
    return document.createTextNode("");
  }

  if (typeof vnode === "string" || typeof vnode === "number") {
    return document.createTextNode(String(vnode));
  }

  if (vnode.type === "TEXT_ELEMENT") {
    return document.createTextNode(vnode.props.nodeValue); // Strictly safe text
  }

  const element = document.createElement(vnode.type);
  // ...
}
```
**Verification Outcome**: `test_runner.js` outputs:
`✅ Checkpoint 1 & Security tests passed successfully!`, with zero script tag instantiation and exact string literal equality.

---

## Defect 2: Input Focus Loss & Caret Reset on Keystroke during Reactive Re-renders

### 1. Defect Description
In Exercise 2 (`app.js`), user typing into the new task input field (`<input onInput={event => setInput(event.target.value)} />`) dispatches a state change via `useState`. In the AI's naive reactive engine:
- Calling `setState` triggered `renderApp()`.
- `renderApp()` executed `rootElement.replaceChildren(dom)`, which wiped the entire root container and remounted brand new DOM elements.
- **The Defect**: Every keystroke immediately caused the active input element to detach from the DOM tree. `document.activeElement` reverted to `document.body`. The user experienced instant focus loss (`blur`) after typing a single letter and was forced to click the input field again for each character. Furthermore, caret cursor positions were wiped.

### 2. Diagnostic Method
1. **DevTools Breakpoint & Active Element Tracking**:
   - In Chrome DevTools, added an Event Listener Breakpoint on `input`.
   - In the DevTools Console, observed:
     ```javascript
     document.activeElement // Before render: <input type="text">
     // After renderApp execution:
     document.activeElement // Reverted to <body>
     ```
2. **User Experience Verification**:
   - Attempted typing "Review PR" into the input. Only the character "R" was entered before focus was dropped, confirming a critical interactive usability failure.

### 3. Refactored Solution (Clean Engineering Fix)

#### ❌ AI-Generated Defective Code:
```javascript
// DEFECTIVE: Blindly replaces DOM without focus/selection preservation
export function renderApp() {
  stateCursor = 0;
  const vnode = rootComponent();
  const dom = renderToDOM(vnode);
  rootElement.replaceChildren(dom); // ⚠️ Focus is permanently lost!
}
```

#### ✅ Refactored & Verified Code in `mini_react.js`:
```javascript
// VERIFIED: Preserves activeElement, vnodeId, and cursor selection range
export function renderApp() {
  if (!rootElement || !rootComponent) return;

  // 1. Snapshot active focus and cursor caret positions
  const active = document.activeElement;
  const oldId = active?.dataset?.vnodeId;
  const start = active?.selectionStart;
  const end = active?.selectionEnd;

  stateCursor = 0;
  nodeId = 0;
  eventRegistry = new Map();

  // 2. Re-render new virtual tree and mount to DOM
  const vnode = rootComponent();
  const dom = renderToDOM(vnode);
  rootElement.replaceChildren(dom);

  // 3. Restore focus and cursor selection seamlessly
  if (oldId) {
    const replacement = rootElement.querySelector(`[data-vnode-id="${oldId}"]`);
    if (replacement) {
      replacement.focus();
      if (
        typeof start === "number" &&
        typeof end === "number" &&
        typeof replacement.setSelectionRange === "function"
      ) {
        replacement.setSelectionRange(start, end);
      }
    }
  }
}
```
**Verification Outcome**: Continuous typing in the task input runs seamlessly at 60 FPS without interruption, maintaining cursor position at the end of input text.

---

## Defect 3: Async Race Condition & Out-of-Order Stale State Overwrite

### 1. Defect Description
In Exercise 3 (`app.js`), the application manages asynchronous data fetching through a Finite State Machine (`IDLE -> LOADING -> SUCCESS | ERROR`). 
- The AI initially created an async fetch handler without any request sequence validation or cancellation mechanism.
- When network responses had variable latency (or when a user repeatedly triggered "Load Data", "Refresh Data", or "Retry Connection"), multiple concurrent HTTP/Promise executions were in flight simultaneously.
- **The Defect (Race Condition)**: If Request #1 experienced longer latency (or failed) and settled *after* Request #2 had already succeeded, Request #1's outdated response (or error message) would override Request #2. The user would see a successful data list suddenly revert to an error screen or display stale data.

### 2. Diagnostic Method
1. **Network Throttling & Artificial Delay in DevTools**:
   - In Chrome DevTools Network Tab, set throttling to **Slow 3G**.
   - Rapidly clicked the "Refresh Data" button twice within 500ms.
2. **Console Trace Analysis**:
   - Added logging with request IDs:
     ```
     [Req 1] Sent at t=0s, latency 2400ms (Fail)
     [Req 2] Sent at t=0.5s, latency 1200ms (Success)
     [Req 2] Settled at t=1.7s -> UI set to SUCCESS
     [Req 1] Settled at t=2.4s -> UI OVERWRITTEN with ERROR!
     ```
   - Confirmed that without an identifier safeguard, stale promises violated state machine determinism.

### 3. Refactored Solution (Clean Engineering Fix)

#### ❌ AI-Generated Defective Code:
```javascript
// DEFECTIVE: Unsafe concurrent async handler
const loadFeedData = async () => {
  setFeedState({ status: STATES.LOADING });
  try {
    const items = await fetchFeed();
    // ⚠️ Any old promise resolving late will corrupt the current UI state!
    setFeedState(transition({ status: STATES.SUCCESS, data: items }));
  } catch (error) {
    setFeedState(transition({ status: STATES.ERROR, error: error.message }));
  }
};
```

#### ✅ Refactored & Verified Code in `app.js`:
```javascript
// VERIFIED: Monotonic Request Token Guard
let latestRequestId = 0;

const loadFeedData = async () => {
  // Capture local sequence token
  const requestId = ++latestRequestId;

  setFeedState({ status: STATES.LOADING });

  try {
    const items = await fetchFeed();

    // Guard: Discard stale response if a newer request was dispatched
    if (requestId !== latestRequestId) {
      return;
    }

    setFeedState(transition({
      status: STATES.SUCCESS,
      data: items
    }));
  } catch (error) {
    // Guard: Discard outdated error responses
    if (requestId !== latestRequestId) {
      return;
    }

    setFeedState(transition({
      status: STATES.ERROR,
      error: error instanceof Error
        ? error.message
        : "An unexpected error occurred."
    }));
  }
};
```
**Verification Outcome**: Even under erratic simulated latency and rapid button spamming, only the most recently initiated request updates the UI. Outdated responses are silently discarded.

---

## Live Defense Preparation (Hướng Dẫn Vấn Đáp Trực Tiếp)

During the live defense, you may be asked to explain any commit or line of code in `mini_react.js`, `state_machine.js`, or `app.js`. Use the cheat sheet below:

### 1. Git History Commit Breakdown

| Commit SHA | Commit Message | Key Architectural Concept |
| :--- | :--- | :--- |
| `ec1e5dd` | `feat(html): semantic landmark tree` | Standard HTML5 semantic landmark elements (`<header>`, `<main>`, `<section>`, `<nav>`, `<footer>`) with ARIA roles. |
| `36676ea` | `feat(core): implement createElement factory` | Virtual DOM tree generator producing lightweight JS objects (`type`, `props`, `children`) and normalized `TEXT_ELEMENT`. |
| `55cabfd` | `feat(state): implement stateStore and resetCursor engine` | Array-backed state persistence (`stateStore[]`) and cursor reset engine (`stateCursor = 0`) before each render cycle. |
| `bf6699e` | `feat(state): implement reactive useState dispatcher` | Dispatcher closure binding `currentIndex` to hook calls; supports functional updates `setState(prev => ...)`. |
| `b85d65d` / `975e007` | `feat(events): attach root event delegation listener` | Root event delegation pattern on `rootElement` using `eventRegistry` Map to prevent event listener memory leaks. |
| `a194e0d` / `4f9b3cd` | `feat(ui): assemble reactive todo application` | Exercise 2 full component composition with filtering (`ALL`, `ACTIVE`, `COMPLETED`), stats, and focus preservation. |
| `aeb88d4` | `feat(ui): implement multi-state data component with skeleton feedback` | Exercise 3 integration: `transition()` pure state machine, animated shimmer skeleton loader, and race condition guard. |

---

### 2. Core Code Explanations for Defense Questions

#### Q1: "Tại sao `useState` của bạn phải reset `stateCursor = 0` trước mỗi lần re-render?"
> **Answer**: `useState` lưu các giá trị state trong một mảng phẳng tuần tự (`stateStore`). Mỗi khi một component gọi `useState`, nó lấy giá trị tại `stateStore[stateCursor]` rồi tăng con trỏ lên `stateCursor++`. Nếu không reset con trỏ về `0` ở đầu hàm `renderApp()`, ở lần render tiếp theo, con trỏ sẽ tiếp tục tăng vượt ngoài biên (`out of bounds`) hoặc đọc nhầm vị trí state của component khác.

#### Q2: "Cơ chế Event Delegation trong `installDelegation()` hoạt động như thế nào?"
> **Answer**: Thay vì gắn `addEventListener` lên từng nút `<button>` hoặc `<input>` con (làm tốn bộ nhớ và dễ rò rỉ bộ nhớ khi DOM bị thay thế), chúng ta chỉ gắn đúng 1 listener duy nhất trên `rootElement` cho các sự kiện `click`, `input`, `change`, `submit`. Khi sự kiện kích hoạt, cơ chế bubbling đẩy sự kiện lên root, thuật toán duyệt `while (target && target !== rootElement)` dựa vào `dataset.vnodeId` để tra cứu handler tương ứng trong `eventRegistry.get(id)` và thực thi.

#### Q3: "Tại sao State Machine trong `state_machine.js` cần kiểm tra `Array.isArray(nextState.data)` ở trạng thái `SUCCESS`?"
> **Answer**: Để đảm bảo tính toàn vẹn dữ liệu (data contract enforcement) theo nguyên lý Deterministic Finite State Machine. Trạng thái `SUCCESS` chỉ hợp lệ khi và chỉ khi có payload dữ liệu dạng mảng để component render danh sách feed. Nếu API trả về `null` hoặc `undefined`, `transition()` lập tức ném lỗi để ngăn ngừa lỗi runtime `undefined.map()` trong giao diện.

#### Q4: "Skeleton loading được xây dựng bằng kỹ thuật gì trong CSS?"
> **Answer**: Sử dụng pseudo-elements kết hợp hiệu ứng `linear-gradient` shimmer di chuyển qua lại (`translateX(-100%)` đến `translateX(100%)`) với CSS animation `keyframes skeleton-shimmer 1.5s infinite`. Khi trạng thái là `STATES.LOADING`, giao diện render placeholder skeleton cards có `aria-busy="true"` giúp cải thiện trải nghiệm người dùng (UX) và khả năng tiếp cận (Accessibility - a11y).

---

## Conclusion & Compliance Declaration

This audit report accurately reflects the code review, testing, and refactoring performed on the codebase of **24520225_NguyenBaoChinh_Lab02_EX3**. All 3 AI failure modes have been rigorously analyzed, verified with unit assertions and browser DevTools, and refactored into production-quality JavaScript.
