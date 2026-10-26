// reactive-engine.js

const stateStore = [];
let stateCursor = 0;
let rootElement = null;
let rootComponent = null;

let nodeId = 0;
let eventRegistry = new Map();
let delegationInstalled = false;

// Exercise 1: createElement
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

// Exercise 1: createTextElement
export function createTextElement(value) {
  return {
    type: "TEXT_ELEMENT",
    props: { nodeValue: String(value) },
    children: []
  };
}

// Exercise 2: custom useState
export function useState(initialValue) {
  const currentIndex = stateCursor;

  if (!(currentIndex in stateStore)) {
    stateStore[currentIndex] =
      typeof initialValue === "function"
        ? initialValue()
        : initialValue;
  }

  function setState(nextValue) {
    stateStore[currentIndex] =
      typeof nextValue === "function"
        ? nextValue(stateStore[currentIndex])
        : nextValue;

    renderApp();
  }

  stateCursor++;

  return [stateStore[currentIndex], setState];
}

// Convert VNode into real DOM nodes.
// Event handlers are registered centrally, not attached to child buttons.
export function renderToDOM(vnode) {
  if (vnode == null || typeof vnode === "boolean") {
    return document.createTextNode("");
  }

  if (
    typeof vnode === "string" ||
    typeof vnode === "number"
  ) {
    return document.createTextNode(String(vnode));
  }

  if (vnode.type === "TEXT_ELEMENT") {
    return document.createTextNode(vnode.props.nodeValue);
  }

  const element = document.createElement(vnode.type);
  const id = String(++nodeId);

  element.dataset.vnodeId = id;

  const handlers = {};

  for (const [key, value] of Object.entries(vnode.props || {})) {
    if (key.startsWith("on") && typeof value === "function") {
      handlers[key.slice(2).toLowerCase()] = value;
      continue;
    }

    if (key === "key" || key === "ref") continue;

    const attributeName = key === "className" ? "class" : key;

    if (key === "value") {
      element.value = value ?? "";
    } else if (key === "checked") {
      element.checked = Boolean(value);
    } else if (key === "disabled") {
      element.disabled = Boolean(value);
    } else if (key === "nodeValue") {
      element.textContent = String(value);
    } else if (value != null && value !== false) {
      if (value === true) {
        element.setAttribute(attributeName, "");
      } else {
        element.setAttribute(attributeName, String(value));
      }
    }
  }

  if (Object.keys(handlers).length > 0) {
    eventRegistry.set(id, handlers);
  }

  for (const child of vnode.children || []) {
    element.appendChild(renderToDOM(child));
  }

  return element;
}

// One listener on the root handles events from descendants.
function installDelegation() {
  if (delegationInstalled || !rootElement) return;

  const delegatedEvents = ["click", "input", "change", "submit"];

  for (const eventType of delegatedEvents) {
    rootElement.addEventListener(eventType, event => {
      let target = event.target;

      if (eventType === "submit") {
        event.preventDefault();
      }

      while (target && target !== rootElement) {
        const id = target.dataset?.vnodeId;
        const handler = id
          ? eventRegistry.get(id)?.[eventType]
          : null;

        if (handler) {
          handler(event);
          return;
        }

        target = target.parentElement;
      }
    });
  }

  delegationInstalled = true;
}

// Reactive render dispatcher
export function renderApp() {
  if (!rootElement || !rootComponent) return;

  const active = document.activeElement;
  const oldId = active?.dataset?.vnodeId;
  const start = active?.selectionStart;
  const end = active?.selectionEnd;

  stateCursor = 0;
  nodeId = 0;
  eventRegistry = new Map();

  const vnode = rootComponent();
  const dom = renderToDOM(vnode);

  rootElement.replaceChildren(dom);

  if (oldId) {
    const replacement = rootElement.querySelector(
      `[data-vnode-id="${oldId}"]`
    );

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

// Mount the app once.
export function createRoot(container, component) {
  rootElement = container;
  rootComponent = component;

  installDelegation();
  renderApp();

  return {
    render: renderApp
  };
}