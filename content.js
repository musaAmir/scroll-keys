let settings = { ...DEFAULT_SETTINGS };

// Track the current smooth scroll animation so we can cancel it
let currentAnimation = null;
const INTERACTIVE_ROLES = new Set([
  'button',
  'checkbox',
  'combobox',
  'radio',
  'searchbox',
  'slider',
  'spinbutton',
  'switch',
  'textbox'
]);

// Load settings from storage
chrome.storage.sync.get(DEFAULT_SETTINGS, (result) => {
  if (chrome.runtime.lastError) {
    return;
  }

  settings = sanitizeSettings(result);
});

// Listen for settings updates
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    const updatedSettings = { ...settings };
    for (const key in changes) {
      if (Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key)) {
        updatedSettings[key] = changes[key].newValue;
      }
    }
    settings = sanitizeSettings(updatedSettings);
  }
});

// Easing function for smooth scrolling (ease-out quad)
function easeOutQuad(t) {
  return t * (2 - t);
}

function getElementFromNode(node) {
  if (!node) return null;
  if (node.nodeType === Node.ELEMENT_NODE) {
    return node;
  }

  return node.parentElement || null;
}

function getParentElement(element) {
  if (!element) return null;
  if (element.parentElement) {
    return element.parentElement;
  }

  const root = element.getRootNode ? element.getRootNode() : null;
  if (root instanceof ShadowRoot) {
    return root.host;
  }

  return null;
}

function getActiveElement(root = document) {
  let activeElement = root.activeElement || null;

  while (activeElement && activeElement.shadowRoot && activeElement.shadowRoot.activeElement) {
    activeElement = activeElement.shadowRoot.activeElement;
  }

  return activeElement;
}

// Find the appropriate element to scroll.
// Prefer the nearest scrollable ancestor of the event target, fall back to the page.
function getScrollTarget(startElement) {
  let el = getElementFromNode(startElement);

  while (el && el !== document.body && el !== document.documentElement) {
    const style = window.getComputedStyle(el);
    const overflowY = style.overflowY;
    const canScroll =
      (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
      el.scrollHeight > el.clientHeight + 1;

    if (canScroll) {
      return el;
    }

    el = getParentElement(el);
  }

  const scrollingElement = document.scrollingElement || document.documentElement || document.body;
  if (scrollingElement && scrollingElement.scrollHeight > scrollingElement.clientHeight + 1) {
    return scrollingElement;
  }

  // Fall back to window – some environments expose scroll only there.
  return window;
}

// Smoothly scroll a target by the given distance over the given duration.
// Works for both window and scrollable elements, and does not try to "guess"
// when we've hit the bottom – it just runs the animation for the duration.
function smoothScrollBy(target, distance, duration) {
  if (currentAnimation !== null) {
    cancelAnimationFrame(currentAnimation);
    currentAnimation = null;
  }

  const isWindow = target === window;
  const start = isWindow
    ? window.scrollY ||
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0
    : target.scrollTop;

  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutQuad(progress);
    const next = start + distance * eased;

    if (isWindow) {
      window.scrollTo(0, next);
    } else {
      target.scrollTop = next;
    }

    if (progress < 1) {
      currentAnimation = requestAnimationFrame(step);
    } else {
      currentAnimation = null;
    }
  }

  currentAnimation = requestAnimationFrame(step);
}

// Check whether keyboard input should remain under the page's control.
function isInteractiveElement(element) {
  if (document.designMode === 'on') {
    return true;
  }

  let currentElement = getElementFromNode(element);

  while (currentElement) {
    const tagName = currentElement.tagName ? currentElement.tagName.toLowerCase() : '';

    if (tagName === 'textarea' || tagName === 'select' || tagName === 'button' || tagName === 'summary') {
      return true;
    }

    if (tagName === 'input') {
      const inputType = (currentElement.type || 'text').toLowerCase();
      if (inputType !== 'hidden') {
        return true;
      }
    }

    if (currentElement.isContentEditable) {
      return true;
    }

    const roleAttribute = currentElement.getAttribute ? currentElement.getAttribute('role') : '';
    const role = roleAttribute ? roleAttribute.trim().split(/\s+/)[0].toLowerCase() : '';
    if (INTERACTIVE_ROLES.has(role)) {
      return true;
    }

    currentElement = getParentElement(currentElement);
  }

  return false;
}

// Handle keyboard events
document.addEventListener(
  'keydown',
  (event) => {
    const eventOrigin = event.composedPath ? event.composedPath()[0] : event.target;

    // Don't trigger while the user is interacting with a form control or editor.
    // Check both event.target and the currently focused element (activeElement)
    // because some sites wrap inputs in containers that receive the event first
    if (isInteractiveElement(eventOrigin) || isInteractiveElement(getActiveElement())) {
      return;
    }

    const pressedKey = normalizeKey(event.key);
    const scrollDownKey = normalizeKey(settings.scrollDownKey);
    const scrollUpKey = normalizeKey(settings.scrollUpKey);

    // Check if this is a scroll key
    const isScrollDown = pressedKey === scrollDownKey;
    const isScrollUp = pressedKey === scrollUpKey;

    if (!isScrollDown && !isScrollUp) {
      return;
    }

    const modifierState = {
      shift: event.shiftKey,
      ctrl: event.ctrlKey,
      alt: event.altKey,
      meta: event.metaKey
    };
    const accelerationModifier = settings.enableAcceleration ? settings.accelerationModifier : null;
    const isAccelerationActive = accelerationModifier ? Boolean(modifierState[accelerationModifier]) : false;
    const hasOtherModifiers = Object.entries(modifierState).some(
      ([modifier, isPressed]) => isPressed && modifier !== accelerationModifier
    );

    // Don't trigger if other modifier keys are pressed (to avoid conflicts with browser shortcuts)
    if (hasOtherModifiers) {
      return;
    }

    // Prevent default behavior and stop all event propagation immediately
    event.preventDefault();
    event.stopImmediatePropagation();

    // Calculate scroll amount with acceleration if active
    const scrollMultiplier = isAccelerationActive ? settings.accelerationMultiplier : 1;
    const scrollDistance = settings.scrollAmount * scrollMultiplier;

    // Determine scroll direction
    const direction = isScrollDown ? 1 : -1;
    const finalDistance = scrollDistance * direction;

    const target = getScrollTarget(eventOrigin);

    // Use custom smooth scroll or instant scroll based on settings
    if (settings.smoothScroll) {
      smoothScrollBy(target, finalDistance, settings.scrollDuration);
    } else if (target === window) {
      window.scrollBy(0, finalDistance);
    } else {
      target.scrollTop += finalDistance;
    }
  },
  true
); // Use capture phase to ensure we get the event first
