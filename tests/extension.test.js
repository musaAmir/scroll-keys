const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const defaultsSource = fs.readFileSync(path.join(root, 'defaults.js'), 'utf8');
const context = vm.createContext({ Set });

vm.runInContext(
  `${defaultsSource}\nthis.api = { DEFAULT_SETTINGS, normalizeKey, isSupportedScrollKey, sanitizeSettings };`,
  context
);

const { DEFAULT_SETTINGS, normalizeKey, isSupportedScrollKey, sanitizeSettings } = context.api;

assert.equal(normalizeKey('↑'), 'arrowup');
assert.equal(normalizeKey('Spacebar'), 'space');
assert.equal(normalizeKey('J'), 'j');
assert.equal(isSupportedScrollKey('j'), true);
assert.equal(isSupportedScrollKey('ArrowDown'), true);
assert.equal(isSupportedScrollKey('Enter'), false);

const valid = sanitizeSettings({
  scrollDownKey: 's',
  scrollUpKey: 'w',
  scrollAmount: 250,
  smoothScroll: false,
  scrollDuration: 300,
  enableAcceleration: false,
  accelerationModifier: 'alt',
  accelerationMultiplier: 4
});
assert.deepEqual(JSON.parse(JSON.stringify(valid)), {
  scrollDownKey: 's',
  scrollUpKey: 'w',
  scrollAmount: 250,
  smoothScroll: false,
  scrollDuration: 300,
  enableAcceleration: false,
  accelerationModifier: 'alt',
  accelerationMultiplier: 4
});

const invalid = sanitizeSettings({
  scrollDownKey: 'j',
  scrollUpKey: 'J',
  scrollAmount: Infinity,
  smoothScroll: 'yes',
  scrollDuration: 0,
  accelerationModifier: 'super',
  accelerationMultiplier: 100
});
assert.deepEqual(JSON.parse(JSON.stringify(invalid)), JSON.parse(JSON.stringify(DEFAULT_SETTINGS)));

let keydownHandler;
const scrollingElement = {
  nodeType: 1,
  tagName: 'HTML',
  parentElement: null,
  scrollHeight: 2000,
  clientHeight: 800,
  scrollTop: 0,
  getAttribute: () => null,
  getRootNode: () => null
};
const pageDocument = {
  activeElement: null,
  body: { scrollTop: 0 },
  documentElement: scrollingElement,
  scrollingElement,
  designMode: 'off',
  addEventListener(type, handler) {
    if (type === 'keydown') keydownHandler = handler;
  }
};
const contentContext = vm.createContext({
  Set,
  Node: { ELEMENT_NODE: 1 },
  ShadowRoot: class ShadowRoot {},
  document: pageDocument,
  window: {
    getComputedStyle: () => ({ overflowY: 'visible' }),
    scrollBy: () => {},
    scrollTo: () => {}
  },
  chrome: {
    runtime: { lastError: null },
    storage: {
      sync: {
        get(defaults, callback) {
          callback({ ...defaults, smoothScroll: false });
        }
      },
      onChanged: { addListener: () => {} }
    }
  },
  performance: { now: () => 0 },
  requestAnimationFrame: () => 1,
  cancelAnimationFrame: () => {}
});
vm.runInContext(`${defaultsSource}\n${fs.readFileSync(path.join(root, 'content.js'), 'utf8')}`, contentContext);

function createKeyEvent(target) {
  return {
    key: 'j',
    target,
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    prevented: false,
    stopped: false,
    composedPath: () => [target],
    preventDefault() {
      this.prevented = true;
    },
    stopImmediatePropagation() {
      this.stopped = true;
    }
  };
}

const button = {
  nodeType: 1,
  tagName: 'BUTTON',
  parentElement: null,
  isContentEditable: false,
  getAttribute: () => null,
  getRootNode: () => null
};
const buttonEvent = createKeyEvent(button);
keydownHandler(buttonEvent);
assert.equal(buttonEvent.prevented, false);

const body = {
  nodeType: 1,
  tagName: 'BODY',
  parentElement: null,
  isContentEditable: false,
  getAttribute: () => null,
  getRootNode: () => null
};
pageDocument.activeElement = body;
const pageEvent = createKeyEvent(body);
keydownHandler(pageEvent);
assert.equal(pageEvent.prevented, true);
assert.equal(pageEvent.stopped, true);
assert.equal(scrollingElement.scrollTop, 100);

class MockElement {
  constructor() {
    this.value = '';
    this.checked = false;
    this.disabled = false;
    this.textContent = '';
    this.className = '';
    this.attributes = {};
    this.listeners = {};
    const classes = new Set();
    this.classList = {
      add: (...names) => names.forEach((name) => classes.add(name)),
      remove: (...names) => names.forEach((name) => classes.delete(name)),
      toggle: (name, force) => (force ? classes.add(name) : classes.delete(name)),
      contains: (name) => classes.has(name)
    };
  }

  addEventListener(type, handler) {
    this.listeners[type] = handler;
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }
}

const elementIds = [
  'scrollDownKey',
  'scrollUpKey',
  'scrollAmount',
  'smoothScroll',
  'scrollDuration',
  'scrollDurationSetting',
  'enableAcceleration',
  'accelerationModifier',
  'accelerationMultiplier',
  'accelerationSettings',
  'saveBtn',
  'resetBtn',
  'status'
];
const elements = Object.fromEntries(elementIds.map((id) => [id, new MockElement()]));
let savedSettings;
const optionsDocumentListeners = {};
const optionsContext = vm.createContext({
  Set,
  setTimeout: (callback) => callback(),
  document: {
    activeElement: null,
    getElementById: (id) => elements[id],
    addEventListener: (type, handler) => {
      optionsDocumentListeners[type] = handler;
    }
  },
  chrome: {
    runtime: { lastError: null },
    storage: {
      sync: {
        get(defaults, callback) {
          callback(defaults);
        },
        set(values, callback) {
          savedSettings = { ...values };
          callback();
        }
      }
    }
  }
});
vm.runInContext(
  `${defaultsSource}\n${fs.readFileSync(path.join(root, 'options.js'), 'utf8')}`,
  optionsContext
);

assert.equal(elements.scrollDownKey.value, 'j');
assert.equal(elements.scrollUpKey.value, 'k');
assert.equal(elements.accelerationModifier.disabled, false);
assert.equal(elements.scrollDuration.disabled, false);

elements.smoothScroll.checked = false;
elements.smoothScroll.listeners.change();
elements.scrollDuration.value = '';
elements.enableAcceleration.checked = false;
elements.enableAcceleration.listeners.change();
elements.accelerationMultiplier.value = '';
elements.saveBtn.listeners.click();
assert.equal(savedSettings.scrollDuration, DEFAULT_SETTINGS.scrollDuration);
assert.equal(savedSettings.accelerationMultiplier, DEFAULT_SETTINGS.accelerationMultiplier);

const saveBeforeInvalidKey = savedSettings;
elements.scrollDownKey.value = 'Enter';
elements.saveBtn.listeners.click();
assert.equal(savedSettings, saveBeforeInvalidKey);
assert.match(elements.status.textContent, /single character/i);

console.log('All extension tests passed.');
