export function $(selector) {
  const el = document.querySelector(selector);
  if (!el) {
    console.warn(`Element not found: ${selector}`);
  }
  return el;
}

export function $$(selector) {
  return document.querySelectorAll(selector);
}

export function on(element, event, handler, options) {
  if (!element) return;
  element.addEventListener(event, handler, options);
  return () => element.removeEventListener(event, handler, options);
}

export function off(element, event, handler, options) {
  if (!element) return;
  element.removeEventListener(event, handler, options);
}

export function createElement(tag, attributes = {}, children = []) {
  const element = document.createElement(tag);
  
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key.startsWith('data-')) {
      element.setAttribute(key, value);
    } else {
      element[key] = value;
    }
  });
  
  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  });
  
  return element;
}

export function removeAllChildren(element) {
  if (!element) return;
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

export function show(element) {
  if (element) element.style.display = '';
}

export function hide(element) {
  if (element) element.style.display = 'none';
}

export function toggle(element, show) {
  if (element) {
    element.style.display = show ? '' : 'none';
  }
}

export function addClass(element, className) {
  if (element) {
    element.classList.add(className);
  }
}

export function removeClass(element, className) {
  if (element) {
    element.classList.remove(className);
  }
}

export function toggleClass(element, className) {
  if (element) {
    element.classList.toggle(className);
  }
}

export function hasClass(element, className) {
  return element ? element.classList.contains(className) : false;
}

export function setAttributes(element, attributes) {
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key.startsWith('data-')) {
      element.setAttribute(key, value);
    } else {
      element[key] = value;
    }
  });
}

export function delegate(parent, eventType, selector, handler) {
  if (!parent) return;
  
  return on(parent, eventType, event => {
    const target = event.target.closest(selector);
    if (target && parent.contains(target)) {
      handler.call(target, event);
    }
  });
}

export function getDataset(element) {
  return element ? { ...element.dataset } : {};
}
