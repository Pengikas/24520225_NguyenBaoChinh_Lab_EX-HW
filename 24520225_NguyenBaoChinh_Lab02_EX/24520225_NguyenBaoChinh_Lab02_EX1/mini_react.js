export function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: String(text),
      children: []
    }
  };
}

export function createElement(type, props, ...children) {
  const normalizedChildren = children
    .flat(Infinity)
    .filter(child => child !== null && child !== undefined && typeof child !== "boolean")
    .map(child => {
      if (typeof child === "string" || typeof child === "number") {
        return createTextElement(child);
      }

      return child;
    });

  return {
    type,
    props: {
      ...(props || {}),
      children: normalizedChildren
    }
  };
}

export function renderToDOM(vnode) {
  if (vnode === null || vnode === undefined) {
    return document.createDocumentFragment();
  }

  if (typeof vnode !== "object" || !vnode.type) {
    return document.createTextNode(String(vnode));
  }

  if (vnode.type === "TEXT_ELEMENT") {
    return document.createTextNode(vnode.props.nodeValue ?? "");
  }

  const dom = document.createElement(vnode.type);
  const props = vnode.props || {};

  Object.entries(props).forEach(([name, value]) => {
    if (name === "children" || value === null || value === undefined) {
      return;
    }

    if (name.startsWith("on") && typeof value === "function") {
      const eventName = name.slice(2).toLowerCase();
      dom.addEventListener(eventName, value);
      return;
    }

    if (name === "style" && typeof value === "object") {
      Object.assign(dom.style, value);
      return;
    }

    if (name === "className") {
      dom.setAttribute("class", value);
      return;
    }

    if (name === "key" || name === "ref" || name === "dangerouslySetInnerHTML") {
      return;
    }

    if (name.startsWith("on")) {
      return;
    }

    if (typeof value === "boolean") {
      if (["disabled", "checked", "selected", "multiple"].includes(name)) {
        dom[name] = value;
      }
      return;
    }
    dom.setAttribute(name, String(value));
  });

  const children = Array.isArray(props.children) ? props.children : [];

  children.forEach(child => {
    dom.appendChild(renderToDOM(child));
  });

  return dom;
}