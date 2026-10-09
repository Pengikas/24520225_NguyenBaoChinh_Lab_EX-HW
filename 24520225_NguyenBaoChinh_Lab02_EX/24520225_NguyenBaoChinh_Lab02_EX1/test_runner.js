import { createElement } from './mini_react.js';

// Verify createElement factory
const vNode = createElement('main', { id: 'root' }, 'Hello World');
console.log('VNode created:', vNode);
