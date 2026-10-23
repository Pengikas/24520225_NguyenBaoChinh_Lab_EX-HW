# Project Rules: Mini-React Virtual DOM & Mounting Engine

**Course:** Web Application Development (Lab 02)  
**Standard:** Strict Engineering Guidelines, Security Policies, and Architecture Constraints  
**Target Codebase:** [mini_react.js](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Exercise/24520225_NguyenBaoChinh_Lab02_EX1/mini_react.js), [test_runner.js](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Exercise/24520225_NguyenBaoChinh_Lab02_EX1/test_runner.js), [index.html](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Exercise/24520225_NguyenBaoChinh_Lab02_EX1/index.html)

---

## 1. Architectural Principles & Core Philosophy

1. **Pure Vanilla ES6+**: No external frameworks, compilers, or build tools are permitted for runtime core logic.
2. **Declarative Virtual DOM**: UI representation must strictly decouple tree declaration (`createElement`) from DOM instantiation (`renderToDOM`).
3. **Security by Default**: Untrusted user inputs and arbitrary strings must never execute or construct unauthorized DOM elements.
4. **Semantic-First Output**: Rendered markup must produce accessible, standards-compliant HTML5 structures without unnecessary wrapper elements.

---

## 2. Data Contracts & VNode Schema

### 2.1 Standard Element VNode
Every non-text VNode produced by `createElement` must adhere strictly to the following shape:

```typescript
interface ElementVNode {
  type: string; // Valid HTML5 tag name: 'main', 'header', 'section', 'button', etc.
  props: {
    [key: string]: any;
    children: (ElementVNode | TextVNode)[];
  };
}
```

### 2.2 Text Element VNode (`TEXT_ELEMENT`)
Text must be encapsulated into a specialized internal node to standardize tree traversal:

```typescript
interface TextVNode {
  type: "TEXT_ELEMENT";
  props: {
    nodeValue: string;
    children: []; // Always an empty array
  };
}
```

---

## 3. Strict Development Rules

### RULE 1: Zero "Div-Soup" (Semantic HTML Mandatory)
- **Constraint:** Using `<div>` elements as default or indiscriminate container wrappers is **STRICTLY FORBIDDEN**.
- **Standard:** Use semantic HTML5 elements representing the structural role:
  - Top-level views: `<main id="root-view" role="main">`
  - Navigational bars: `<nav>`
  - Sectional divisions: `<section>`, `<article>`, `<aside>`
  - Informational headers/footers: `<header>`, `<footer>`
  - Interactive triggers: `<button type="button">`, `<a>`
- **Verification:** Any AI-suggested or author-written code introducing redundant `<div>` containers will fail the audit.

---

### RULE 2: Zero HTML Injection (Strict XSS Immunity)
- **Constraint:** The following APIs are **BANNED** across the entire codebase:
  - `element.innerHTML`
  - `element.outerHTML`
  - `element.insertAdjacentHTML()`
  - `document.write()`
  - `eval()` / `new Function()`
- **Implementation:**
  - All text rendering must use `document.createTextNode(vnode.props.nodeValue ?? "")`.
  - Content strings containing HTML syntax (e.g. `<script>alert(1)</script>`, `<img onerror=...>`) must be rendered as literal text nodes.
- **Verification:**
  ```javascript
  console.assert(root.querySelector('script') === null, 'XSS Vulnerability!');
  console.assert(node.textContent === '<script>alert(1)</script>');
  ```

---

### RULE 3: Strict Child Normalization & Typeguarding
- **Input Flexibility:** `createElement` must accept nested arrays, numbers, strings, and conditionally rendered booleans.
- **Normalization Pipeline in `createElement`:**
  1. Recursively flatten child arguments: `children.flat(Infinity)`.
  2. Filter out non-renderable items: `child !== null && child !== undefined && typeof child !== "boolean"`.
  3. Transform primitives (`string`, `number`) into `TEXT_ELEMENT` via `createTextElement(child)`.
  4. Leave valid VNode objects untouched.
- **Negative Cases:** Booleans (`true`, `false`), `null`, and `undefined` must **NEVER** render as text or empty elements in the real DOM.

---

### RULE 4: Deterministic DOM Property & Event Dispatching
When iterating over `vnode.props` in `renderToDOM`:

1. **Reserved Keys:**
   - Immediately skip: `children`, `key`, `ref`, `dangerouslySetInnerHTML`.
2. **Nullish Values:**
   - Skip if `value === null || value === undefined`.
3. **Class Names:**
   - `className` must map to the HTML class attribute: `dom.setAttribute("class", value)`.
4. **Event Listeners:**
   - Props starting with `on` where value is a function:
     - Extract event name: `name.slice(2).toLowerCase()`.
     - Attach listener: `dom.addEventListener(eventName, value)`.
     - **FORBIDDEN:** Never set `dom[name] = value` or `dom.setAttribute(name, value)` for functions.
5. **Inline Styles:**
   - If `name === "style"` and `typeof value === "object"`, assign via `Object.assign(dom.style, value)`.
6. **Boolean IDL Attributes:**
   - For recognized boolean attributes (`["disabled", "checked", "selected", "multiple"]`), assign directly to the DOM property: `dom[name] = Boolean(value)`.
7. **Generic Attributes:**
   - For all other attributes, use `dom.setAttribute(name, String(value))`.

---

### RULE 5: Live DevTools Audit & Clean DOM Tree
- **No Orphan Nodes:** The DOM hierarchy in Chrome DevTools Elements panel must be an exact 1:1 replica of the VNode structure.
- **Root Mounting:** Clear existing container children safely using `root.replaceChildren(renderToDOM(vApp))` instead of clearing via `root.innerHTML = ''`.
- **Event Verification:** Event listeners must be inspectable under the DevTools "Event Listeners" tab on the exact target element (e.g. `<button>`).

---

### RULE 6: Git Workflow & Conventional Commits Protocol
To satisfy sprint requirements and evaluation rubrics, changes must be committed atomically with conventional commit formatting:

| Commit Order | Required Message | Content Scope |
|---|---|---|
| **Commit 1** | `feat(core): implement createElement factory` | `createElement`, `createTextElement`, child normalization |
| **Commit 2** | `feat(core): implement renderToDOM` | DOM element creation, prop dispatching, event listeners, recursive mounting |
| **Commit 3** | `docs(audit): add mandatory AI failure mode audit report` | Verification tests, security checklist, `AI_FAILURE_AUDIT.md` |

---

## 4. AI Code Review & Audit Protocol

Any code proposed by AI assistants must be audited against the three primary defect modes documented in [AI_FAILURE_AUDIT.md](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Exercise/24520225_NguyenBaoChinh_Lab02_EX1/AI_FAILURE_AUDIT.md):

1. **Defect 1 (XSS via innerHTML):** Check for string interpolation into HTML sinks.
2. **Defect 2 (Child Normalization Failure):** Check if booleans render as `"false"` or nested child arrays fail to mount.
3. **Defect 3 (Blind Property Assignment):** Check for `element[name] = value` loops causing broken class attributes or leaked event handlers.

---

## 5. Verification Checklist Before Submission

- [x] `createElement` handles variable args, nested arrays, and primitives.
- [x] `createTextElement` wraps strings/numbers into `{ type: "TEXT_ELEMENT", ... }`.
- [x] `renderToDOM` produces `<main>`, `<header>`, `<section>`, `<button>` without `<div>` soup.
- [x] Input `<script>alert(1)</script>` renders as literal text; no script element exists in DOM.
- [x] Button click triggers `console.log('Ping')`.
- [x] All `console.assert` checks pass in [test_runner.js](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Exercise/24520225_NguyenBaoChinh_Lab02_EX1/test_runner.js).
- [x] Git log contains the required conventional commit messages.
