# AI Failure Audit Report

## Project: Mini-React VNode & Mounting Engine

## Purpose

This report documents three AI-induced defects to investigate during code review of the Mini-React implementation. The examples are relevant to the exercise requirements: semantic HTML, safe text rendering, correct VNode-to-DOM mapping, and reliable event/property handling.

**Evidence note:** The defects below are review cases and proposed fixes. Before submitting, confirm each defect against the actual implementation and Git history. Do not claim that a defect was observed or fixed unless your code or diff provides evidence.

---

## Defect 1 — Potential XSS caused by rendering text as HTML

### 1. Defect description

An AI-generated implementation may render a text child by assigning the value to `element.innerHTML`. This treats user-provided text as markup rather than as text. For example, the child string `<script>alert(1)</script>` must appear as literal text and must not create a `script` element. Using `innerHTML` for untrusted child strings creates an injection risk and violates the exercise's XSS checkpoint.

### 2. Diagnostic method

1. Inspect `mini_react.js` and search for `innerHTML`, `insertAdjacentHTML`, or other APIs that parse strings as HTML.
2. Inspect the relevant changes with `git diff` and identify whether an AI-suggested change introduced the unsafe sink.
3. Run a test with the exact string `<script>alert(1)</script>` as a child.
4. In DevTools → Elements, verify that the string is represented as a text node and that no `script` element was created by rendering it.

Example test:

```js
const xssTest = createElement(
  "p",
  null,
  "<script>alert(1)</script>"
);

const node = renderToDOM(xssTest);

console.assert(node.textContent === "<script>alert(1)</script>");
console.assert(node.querySelector("script") === null);
```

### 3. Refactored solution

Create text nodes with `document.createTextNode()` and use `textContent` when setting text. Do not use `innerHTML` to render ordinary VNode string children.

```js
export function createTextElement(value) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: String(value),
      children: []
    }
  };
}
```

In the mounting function, handle the text VNode explicitly:

```js
if (vnode.type === "TEXT_ELEMENT") {
  return document.createTextNode(vnode.props.nodeValue);
}
```

Keep the implementation consistent with the project's existing VNode shape. Re-run the test and confirm that the content is displayed literally, with no script element created.

**Verification criteria**
- The rendered text equals the original string.
- No injected `script` element exists.
- No HTML parsing API is used for ordinary text children.

---

## Defect 2 — Incorrect normalization of VNode children

### 1. Defect description

An AI-generated `createElement` factory may handle only string children or may leave `null`, booleans, nested arrays, or numbers in the children list. This can lead to errors during mounting, missing text, unwanted text such as `false`, or a VNode tree that does not match the resulting DOM.

For this exercise, child normalization should be predictable: ignore `null`, `undefined`, and boolean children; flatten nested child arrays; and convert strings and numbers into text VNodes. Element children should remain in their original order.

### 2. Diagnostic method

1. Inspect the `createElement` and `createTextElement` functions.
2. Review `git diff` for changes to array flattening, filtering, and primitive conversion.
3. Test a mixture of nested arrays, numbers, strings, `null`, and booleans.
4. Compare the VNode children with the actual DOM in DevTools → Elements.

Example test:

```js
const tree = createElement(
  "main",
  null,
  "A",
  7,
  null,
  false,
  [
    createElement("section", null, "B"),
    ["C", true]
  ]
);

const node = renderToDOM(tree);

console.assert(node.tagName === "MAIN");
console.assert(node.textContent === "A7BC");
console.assert(node.querySelectorAll("section").length === 1);
```

Adjust this test if the assignment specifies different normalization semantics.

### 3. Refactored solution

Normalize children in one place before creating the VNode. A representative implementation is:

```js
export function createElement(type, props, ...children) {
  const normalizedChildren = children
    .flat(Infinity)
    .filter(
      child =>
        child !== null &&
        child !== undefined &&
        typeof child !== "boolean"
    )
    .map(child =>
      typeof child === "string" || typeof child === "number"
        ? createTextElement(child)
        : child
    );

  return {
    type,
    props: {
      ...(props ?? {}),
      children: normalizedChildren
    }
  };
}
```

This is a reference implementation, not a guaranteed drop-in replacement. If the project already uses a different VNode structure or supports other child types, preserve those conventions and validate inputs as appropriate.

**Verification criteria**
- Nested arrays are flattened in order.
- `null`, `undefined`, and boolean children do not create DOM nodes.
- Strings and numbers render as text nodes.
- Nested element structure is preserved.

---

## Defect 3 — Incorrect DOM property and event handling

### 1. Defect description

An AI-generated mounting function may blindly assign every prop using `element[key] = value`. This can mishandle `className`, attempt to assign event handlers as ordinary properties, or fail to register listeners consistently. The result may be incorrect CSS classes, non-working click handlers, or unexpected DOM attributes.

The exercise uses props such as `className` and `onClick`, so both must be handled intentionally.

### 2. Diagnostic method

1. Inspect `renderToDOM` for a generic property-assignment loop.
2. Review the Git diff for changes involving `className`, event props, or `addEventListener`.
3. Render an element with `className: "hero"` and an `onClick` handler.
4. In DevTools → Elements, check the actual `class` attribute. In DevTools → Console, verify that clicking the button invokes the handler exactly once.

Example test:

```js
let clicks = 0;

const button = renderToDOM(
  createElement(
    "button",
    {
      className: "action-button",
      onClick: () => {
        clicks += 1;
      }
    },
    "Click"
  )
);

console.assert(button.classList.contains("action-button"));
button.click();
console.assert(clicks === 1);
```

### 3. Refactored solution

Use explicit rules for event handlers and class names rather than treating all props identically. A representative approach is:

```js
function setDOMProperty(element, name, value) {
  if (name === "children" || value == null) {
    return;
  }

  if (name === "className") {
    element.setAttribute("class", value);
    return;
  }

  if (/^on[A-Z]/.test(name) && typeof value === "function") {
    const eventName = name.slice(2).toLowerCase();
    element.addEventListener(eventName, value);
    return;
  }

  if (name === "style" && typeof value === "object") {
    Object.assign(element.style, value);
    return;
  }

  element.setAttribute(name, String(value));
}
```

Call this helper for each prop that should be applied to the DOM. In a production-quality renderer, property handling should also distinguish boolean attributes, DOM properties, SVG attributes, and event-listener cleanup. For this exercise, implement only the cases required by your tests and specification.

**Verification criteria**
- `className` appears as the expected HTML `class` attribute.
- `onClick` runs when the button is clicked.
- `children` is not accidentally serialized as a DOM attribute.
- The implementation does not assign event functions as ordinary HTML attributes.

---

## Review and verification checklist

Before submitting, complete this checklist with evidence from your own project:

- [ ] Confirmed each reported defect exists in the reviewed code or in an identifiable AI-proposed change.
- [ ] Recorded the relevant file and line numbers for each defect.
- [ ] Used `git diff` or a DevTools breakpoint to diagnose each defect.
- [ ] Applied and tested the corresponding fix.
- [ ] Verified that `<main>`, `<section>`, and `<button>` render as semantic elements without unnecessary wrapper `div` elements.
- [ ] Verified the XSS test renders the attack string as text.
- [ ] Compared the VNode tree and DOM tree in DevTools and checked for orphan nodes.
- [ ] Ran the available test suite and recorded the actual results.
- [ ] Reviewed the Git history and can explain each changed line during the live defense.

## Evidence log

Fill in this table with real evidence before submission.

| Defect | Evidence / file and lines | Test result |
|---|---|---|
| XSS / unsafe HTML rendering | TODO: add actual file, line numbers, or commit | TODO |
| Child normalization | TODO: add actual file, line numbers, or commit | TODO |
| DOM props / event handling | TODO: add actual file, line numbers, or commit | TODO |

## Final note

This audit is intended to demonstrate careful engineering review rather than to blame AI tools. AI-generated code must be treated as a proposal: inspect it, test its behavior, understand the fix, and keep evidence in Git history. Replace all TODOs and revise any example that does not match the actual implementation before submitting this report.
