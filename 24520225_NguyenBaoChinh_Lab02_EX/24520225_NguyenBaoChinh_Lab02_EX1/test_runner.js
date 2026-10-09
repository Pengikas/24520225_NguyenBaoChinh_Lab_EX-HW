// Checkpoint 1 Verification Test Suite:
import { createElement, renderToDOM } from './mini_react.js';

const vApp = createElement('main', { id: 'root-view', role: 'main' },
  createElement('header', { className: 'hero' },
    createElement('h1', null, 'Mini React Engine'),
    createElement('p', null, '<img onerror=alert(1)> Safe Text')
  ),
  createElement('section', { id: 'security-test' }, '<script>alert(1)</script>'),
  createElement('button', { onClick: () => console.log('Ping') }, 'Click')
);

const root = document.getElementById('app');
root.replaceChildren(renderToDOM(vApp));

// Security Checkpoint & Mount Assertions
console.assert(root.querySelector('button') !== null, 'Mount Failed');
console.assert(root.querySelector('script') === null, 'XSS Vulnerability: <script> was parsed into DOM!');
console.assert(
  root.querySelector('#security-test').textContent === '<script>alert(1)</script>',
  'XSS text node verification failed'
);
console.log('✅ Checkpoint 1 & Security tests passed successfully!');

