# PROJECT_STRUCTURE.md

## Exercise 1: Building Mini-React VNode & Mounting Engine

**Course:** Web Application Development (Lab 02 — Exercise 1)  
**Deliverable:** Zero div-soup semantic tree, strict typeguard verification, safe text node mounting (XSS immunity), and live DevTools audit.  
**Core Technologies:** Pure Vanilla ES6+ JavaScript, DOM Level 2/3 Event APIs, W3C Semantic HTML5.

---

## 1. Directory Structure

```text
24520225_NguyenBaoChinh_Lab02_EX1/
├── index.html              # HTML test harness and root mounting point (#app)
├── mini_react.js           # Core Mini-React engine: createElement, createTextElement, renderToDOM
├── test_runner.js          # Checkpoint 1 verification test suite and security assertions
├── TASK_DECOMPOSITION.md   # 35-minute sprint breakdown, WBS phases, and atomic commit plan
├── AI_FAILURE_AUDIT.md     # In-depth code audit documenting 3 AI failure modes & mitigations
└── PROJECT_STRUCTURE.md    # Architecture map, file responsibilities, data contracts & constraints
```

---

## 2. File Responsibilities

| File | Responsibility | Key Exports / Elements | Design Constraints |
|---|---|---|---|
| `index.html` | Browser host page & test mounting environment | `<div id="app"></div>`, `<script type="module" src="./test_runner.js">` | Minimal container markup; all application views are dynamically rendered by Mini-React |
| `mini_react.js` | Core Virtual DOM library implementation | `createElement()`, `createTextElement()`, `renderToDOM()` | Zero external dependencies; safe text node instantiation via `document.createTextNode()`; no `innerHTML` |
| `test_runner.js` | Automated assertion runner & checkpoint suite | `vApp` VNode tree, `console.assert` test suite | Exercises all semantic tags (`<main>`, `<header>`, `<h1>`, `<p>`, `<section>`, `<button>`); tests event listeners and XSS vectors |
| `TASK_DECOMPOSITION.md` | Sprint breakdown and execution plan | 5-phase 35-minute sprint schedule, risk mitigation matrix | Prescribes atomic Git commits and DevTools verification checkpoints |
| `AI_FAILURE_AUDIT.md` | Audit report of AI-generated defects | 3 AI failure modes: XSS injection, child normalization flaws, blind property assignment | Documents reproduction steps, diagnostic methods, refactored solutions, and verification criteria |
| `PROJECT_STRUCTURE.md` | Architecture map & specifications | System architecture, data contracts, file mapping, verification commands | Single source of truth for repository structure and quality gates |

---

## 3. Architectural Specifications & Data Contracts

### 3.1 Virtual Node (VNode) Schema

#### Standard Element VNode
Every non-text element created via `createElement()` strictly matches the following contract:
```typescript
interface ElementVNode {
  type: string; // Valid semantic HTML5 tag: 'main', 'header', 'section', 'button', etc.
  props: {
    [key: string]: any;
    children: (ElementVNode | TextVNode)[];
  };
}
```

#### Text Element VNode (`TEXT_ELEMENT`)
Text content is wrapped in a dedicated descriptor node:
```typescript
interface TextVNode {
  type: "TEXT_ELEMENT";
  props: {
    nodeValue: string;
    children: []; // Always an empty array
  };
}
```

### 3.2 VNode Factory Engine (`createElement`)

- **Signature:** `createElement(type, props, ...children)`
- **Child Normalization Pipeline:**
  1. **Infinite Flattening:** `children.flat(Infinity)` unfolds deeply nested arrays of child nodes.
  2. **Filtering Non-Renderables:** Strips out `null`, `undefined`, and `boolean` (`child !== null && child !== undefined && typeof child !== "boolean"`).
  3. **Primitive Wrapping:** Converts `string` and `number` primitives into `TEXT_ELEMENT` nodes via `createTextElement(child)`.
  4. **VNode Preservation:** Leaves existing VNode objects intact.
  5. **Props Encapsulation:** Merges props (`props || {}`) with `children: normalizedChildren`.

### 3.3 DOM Mounting Engine (`renderToDOM`)

- **Signature:** `renderToDOM(vnode)`
- **Mounting & Dispatch Pipeline:**
  1. **Nullish & Boundary Handling:** Returns `document.createDocumentFragment()` if `vnode` is null/undefined. If `vnode` is a raw primitive, safely converts it via `document.createTextNode(String(vnode))`.
  2. **Text Node Instantiation:** If `vnode.type === "TEXT_ELEMENT"`, returns `document.createTextNode(vnode.props.nodeValue ?? "")`.
  3. **Element Creation:** Instantiates target element via `document.createElement(vnode.type)`.
  4. **Property & Attribute Dispatch:**
     - **Reserved Keys:** Skips `children`, `key`, `ref`, and `dangerouslySetInnerHTML`.
     - **Nullish Props:** Skips props where `value == null`.
     - **Event Handlers:** Keys matching `/^on/` with function values extract the event name (`name.slice(2).toLowerCase()`) and attach via `dom.addEventListener(eventName, value)`.
     - **Class Names:** `className` maps directly to `dom.setAttribute("class", value)`.
     - **Inline Styles:** Object values for `style` are applied via `Object.assign(dom.style, value)`.
     - **Boolean IDL Attributes:** Attributes in `["disabled", "checked", "selected", "multiple"]` are assigned directly to the IDL property (`dom[name] = Boolean(value)`).
     - **General Attributes:** All other props are set via `dom.setAttribute(name, String(value))`.
  5. **Recursive Mounting:** Recursively maps and appends each child in `props.children` via `dom.appendChild(renderToDOM(child))`.

---

## 4. Task Specifications & Quality Constraints

### 4.1 Semantic Constraint: Zero Div-Soup
- **Rule:** Arbitrary `<div>` elements are banned as component wrappers.
- **Enforcement:** The output tree must strictly utilize semantic landmark elements:
  - `<main id="root-view" role="main">` for top-level view containers.
  - `<header class="hero">` for heading and introductory sections.
  - `<section id="security-test">` for content subdivisions.
  - `<button>` with event listeners for interactive triggers.

### 4.2 Security Checkpoint: Strict XSS Immunity
- **Rule:** Untrusted user input or strings containing HTML tags must never be parsed into live DOM nodes.
- **Banned APIs:** `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval()`.
- **Enforcement:** All textual content is rendered strictly via `document.createTextNode()`.
- **Verification Vector:**
  ```javascript
  createElement('p', null, '<img onerror=alert(1)> Safe Text')
  createElement('section', { id: 'security-test' }, '<script>alert(1)</script>')
  ```
  Both strings must render as literal, inert text nodes in the DOM.

### 4.3 Live DevTools Audit
- **Elements Panel:** Ensure the browser DOM matches the VNode tree with a 1:1 hierarchy, containing zero orphan whitespace or detached `#text` nodes.
- **Event Listeners Tab:** Inspect the `<button>` element to verify the `click` listener is registered to the expected function.

### 4.4 Git Atomic Commits Protocol
The project repository requires the following conventional commit milestones:

| Milestone | Commit Message | Scope |
|---|---|---|
| **Commit 1** | `feat(core): implement createElement factory` | `createElement`, `createTextElement`, child normalization |
| **Commit 2** | `feat(core): implement renderToDOM` | `renderToDOM`, prop dispatcher, event listeners, recursive child mounting |
| **Commit 3** | `docs(audit): add mandatory AI failure mode audit report` | Verification suite, DevTools evidence, `AI_FAILURE_AUDIT.md` |

---

## 5. Execution & Verification

### 5.1 Running the Test Suite
Serve the project directory using any static HTTP server:

```bash
# Using npx serve:
npx serve .

# Or using Python 3:
python3 -m http.server 3000
```

Open `http://localhost:3000/index.html` in Chrome/Chromium.

### 5.2 Verification Checks

```javascript
// Checkpoint 1 verification in test_runner.js:
console.assert(root.querySelector('button') !== null, 'Mount Failed');
console.assert(root.querySelector('script') === null, 'XSS Vulnerability: <script> was parsed into DOM!');
console.assert(
  root.querySelector('#security-test').textContent === '<script>alert(1)</script>',
  'XSS text node verification failed'
);
```

Expected browser Console output:
```text
✅ Checkpoint 1 & Security tests passed successfully!
```
Clicking the rendered button will log:
```text
Ping
```
