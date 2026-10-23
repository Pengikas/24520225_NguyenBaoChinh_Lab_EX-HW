# Task Decomposition: In-Class Sprint 1 (35 Minutes)

**Course:** Web Application Development (Lab 02 - Exercise 1)  
**Project:** Building Mini-React VNode & Mounting Engine  
**Sprint Duration:** 35 Minutes  
**Deliverables:** Zero div-soup semantic tree, strict typeguard verification, safe text node mounting (XSS immunity), and live DevTools audit.

---

## 1. Sprint Overview & Objectives

The primary objective is to implement a lightweight Virtual DOM (VNode) factory and a DOM mounting engine from scratch using vanilla ES6+ JavaScript, meeting strict semantic, security, and architectural constraints.

```
+---------------------------------------------------------------------------------------------------+
|                                  IN-CLASS SPRINT 1 TIMELINE (35 MINS)                             |
|                                                                                                   |
| [00:00 - 05:00]  Phase 1: Architecture & Type Contracts Setup                                     |
| [05:00 - 15:00]  Phase 2: Task 1 - VNode Factory Engine (createElement & createTextElement)       |
| [15:00 - 25:00]  Phase 3: Task 2 - DOM Mounting Engine (renderToDOM & Prop Dispatcher)            |
| [25:00 - 30:00]  Phase 4: Task 3 - Security & Semantic Constraints Verification (XSS Checkpoint)  |
| [30:00 - 35:00]  Phase 5: Task 4 & 5 - DevTools Audit, Verification Suite & Git Atomic Commits    |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Work Breakdown Structure (WBS)

### Phase 1: Architecture & Contract Definition (Mins 00 – 05)
* **Goal:** Define the exact VNode memory schema and input/output contracts.
* **Tasks:**
  - Define `TEXT_ELEMENT` descriptor structure: `{ type: "TEXT_ELEMENT", props: { nodeValue, children: [] } }`.
  - Define Element VNode descriptor structure: `{ type, props: { ...props, children: [] } }`.
  - Establish boundary conditions: handling empty/null props and variable rest arguments for `children`.

---

### Phase 2: Task 1 — Implement VNode Factory (`createElement` & `createTextElement`) (Mins 05 – 15)
* **Goal:** Create resilient factory functions that normalize heterogeneous child inputs into a predictable tree.
* **Component:** [mini_react.js](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Exercise/24520225_NguyenBaoChinh_Lab02_EX1/mini_react.js)
* **Detailed Steps:**
  1. **Implement `createTextElement(text)`:**
     - Force conversion of `text` to primitive string using `String(text)`.
     - Return `{ type: "TEXT_ELEMENT", props: { nodeValue: String(text), children: [] } }`.
  2. **Implement `createElement(type, props, ...children)`:**
     - Flatten `children` array infinitely to support nested arrays (`children.flat(Infinity)`).
     - Filter out ignorable values: `null`, `undefined`, and `boolean` (`typeof child !== 'boolean'`).
     - Map string and number primitives to `createTextElement(child)`.
     - Preserve existing VNode objects intact.
     - Safely merge `props` (falling back to `{}` if `null` or `undefined`).
     - Attach `normalizedChildren` to `props.children`.
* **Git Milestone 1:**
  - Commit message: `feat(core): implement createElement factory`

---

### Phase 3: Task 2 — Implement Mounting Engine (`renderToDOM`) (Mins 15 – 25)
* **Goal:** Recursively transform an abstract VNode tree into real browser DOM nodes without data leakage or orphan nodes.
* **Component:** [mini_react.js](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Exercise/24520225_NguyenBaoChinh_Lab02_EX1/mini_react.js)
* **Detailed Steps:**
  1. **Handle Primitive & Boundary VNodes:**
     - If `vnode == null`, return `document.createDocumentFragment()` (safe no-op node).
     - If `vnode` is a raw string/number (malformed VNode), fallback to `document.createTextNode(String(vnode))`.
     - If `vnode.type === "TEXT_ELEMENT"`, return `document.createTextNode(vnode.props.nodeValue ?? "")`.
  2. **Create Real DOM Element:**
     - Instantiate element: `const dom = document.createElement(vnode.type)`.
  3. **Dispatch & Bind Properties/Attributes:**
     - Skip reserved keys: `children`, `key`, `ref`, `dangerouslySetInnerHTML`.
     - Skip nullish attribute values (`value == null`).
     - **Event Listeners:** Detect `name.startsWith("on") && typeof value === "function"`.
       - Extract event name: `name.slice(2).toLowerCase()`.
       - Bind via `dom.addEventListener(eventName, value)`.
     - **Class Names:** If `name === "className"`, apply `dom.setAttribute("class", value)`.
     - **Inline Styles:** If `name === "style"` and value is an object, apply via `Object.assign(dom.style, value)`.
     - **Boolean Properties:** For `["disabled", "checked", "selected", "multiple"]`, set IDL property `dom[name] = Boolean(value)`.
     - **Standard Attributes:** For all other props, set `dom.setAttribute(name, String(value))`.
  4. **Recursive Child Mounting:**
     - Iterate through `vnode.props.children` and recursively append: `dom.appendChild(renderToDOM(child))`.
* **Git Milestone 2:**
  - Commit message: `feat(core): implement renderToDOM`

---

### Phase 4: Task 3 — Security Checkpoint & Semantic Constraints Verification (Mins 25 – 30)
* **Goal:** Validate strict compliance with lab security and architectural rules.
* **Component:** [test_runner.js](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Exercise/24520225_NguyenBaoChinh_Lab02_EX1/test_runner.js)
* **Specific Verifications:**
  1. **Semantic HTML Constraint (Div-Soup Banned):**
     - Verify root structures strictly utilize semantic landmarks: `<main>`, `<header>`, `<h1>`, `<p>`, `<section>`, `<button>`.
     - Confirm absence of non-semantic wrapper `<div>` nodes inside the mounted tree.
  2. **XSS Security Checkpoint:**
     - Input vectors tested:
       - `<script>alert(1)</script>`
       - `<img onerror=alert(1)> Safe Text`
     - Expected Behavior: Input must be treated exclusively as text data via `document.createTextNode`.
     - Verifications:
       ```javascript
       console.assert(root.querySelector('script') === null, 'XSS Vulnerability!');
       console.assert(root.querySelector('#security-test').textContent === '<script>alert(1)</script>');
       ```

---

### Phase 5: Task 4 & 5 — Live DevTools Audit & Git Verification (Mins 30 – 35)
* **Goal:** Live audit on Chrome/Browser DevTools and final commit checks.
* **Actionable Checklist:**
  1. **DevTools Elements Panel Inspection:**
     - Confirm `<main id="root-view" role="main">` is mounted directly under `#app`.
     - Expand `<header class="hero">` and check that `<h1>` and `<p>` are direct descendants.
     - Verify no `#text` orphan whitespace nodes exist outside expected elements.
  2. **DevTools Event Listeners Panel:**
     - Select `<button>` element.
     - Switch to "Event Listeners" tab in DevTools.
     - Confirm `click` listener is registered to the function `() => console.log('Ping')`.
     - Click the button; confirm `"Ping"` logs to the Console once per click.
  3. **Git History Conformance Check:**
     - Confirm exactly required commit format exists:
       - Commit 1: `feat(core): implement createElement factory`
       - Commit 2: `feat(core): implement renderToDOM`

---

## 3. Risk & Mitigation Matrix

| Potential Failure Mode | Root Cause | Preventive Measure |
|---|---|---|
| **XSS Vulnerability** | Using `innerHTML` or `outerHTML` to insert child strings. | Enforce `document.createTextNode()` exclusively for all string children. |
| **Div-Soup Anti-Pattern** | Habitual wrapping of components in unnecessary `<div>` elements. | Enforce semantic HTML5 (`<main>`, `<header>`, `<section>`, `<article>`) in test runner. |
| **Event Binding Failure** | Assigning `dom[name] = handler` or `setAttribute(name, handler)`. | Use `addEventListener` with lowercased event name (`name.slice(2).toLowerCase()`). |
| **Boolean Attribute Corruption** | Setting `disabled="false"` via `setAttribute`, which browsers interpret as truthy disabled. | Set boolean attributes directly on IDL property: `dom[name] = Boolean(value)`. |
| **Missing/Orphan Child Nodes** | Failure to flatten nested children arrays `[[child1], child2]`. | Apply `.flat(Infinity)` and ignore `null`/`undefined`/`boolean` in `createElement`. |
