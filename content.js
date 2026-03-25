let settings = { ...DEFAULT_SETTINGS };

// Track the current smooth scroll animation so we can cancel it
let currentAnimation = null;

// Load settings from storage
chrome.storage.sync.get(DEFAULT_SETTINGS, (result) => {
  settings = result;
});

// Listen for settings updates
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    for (const key in changes) {
      settings[key] = changes[key].newValue;
    }
  }
});

// Normalise key values so options (e.g. arrow symbols) match event.key
function normalizeKey(key) {
  if (!key) return '';

  const lower = key.toLowerCase();

  switch (lower) {
    case 'arrowup':
    case '↑':
      return 'arrowup';
    case 'arrowdown':
    case '↓':
      return 'arrowdown';
    case 'arrowleft':
    case '←':
      return 'arrowleft';
    case 'arrowright':
    case '→':
      return 'arrowright';
    case ' ':
    case 'space':
    case 'spacebar':
      return 'space';
    default:
      return lower;
  }
}

// Easing function for smooth scrolling (ease-out quad)
function easeOutQuad(t) {
  return t * (2 - t);
}

// Find the appropriate element to scroll.
// Prefer the nearest scrollable ancestor of the event target, fall back to the page.
function getScrollTarget(startElement) {
  let el = startElement;

  while (el && el !== document.body && el !== document.documentElement) {
    const style = window.getComputedStyle(el);
    const overflowY = style.overflowY;
    const canScroll =
      (overflowY === 'auto' || overflowY === 'scroll') &&
      el.scrollHeight > el.clientHeight + 1;

    if (canScroll) {
      return el;
    }

    el = el.parentElement;
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
  if (currentAnimation) {
    cancelAnimationFrame(currentAnimation.id);
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
      currentAnimation = {
        id: requestAnimationFrame(step),
        target
      };
    } else {
      currentAnimation = null;
    }
  }

  currentAnimation = {
    id: requestAnimationFrame(step),
    target
  };
}

// Check if the current element is an input field or editable content
function isInputField(element) {
  if (!element) return false;

  const tagName = element.tagName.toLowerCase();
  const inputTypes = ['text', 'password', 'email', 'search', 'tel', 'url', 'number', 'date', 'datetime-local', 'time', 'week', 'month'];

  // Check if it's a standard input element
  if (tagName === 'textarea' || tagName === 'select') {
    return true;
  }

  if (tagName === 'input' && inputTypes.includes(element.type)) {
    return true;
  }

  // Check if the element is contentEditable
  if (element.isContentEditable) {
    return true;
  }

  // Check for ARIA textbox role (used by many modern web apps including Reddit)
  const role = element.getAttribute('role');
  if (role === 'textbox' || role === 'searchbox') {
    return true;
  }

  // Check if document is in design mode (some rich text editors)
  if (document.designMode === 'on') {
    return true;
  }

  return false;
}

// Handle keyboard events
document.addEventListener(
  'keydown',
  (event) => {
    // Don't trigger if user is typing in an input field
    // Check both event.target and the currently focused element (activeElement)
    // because some sites wrap inputs in containers that receive the event first
    if (isInputField(event.target) || isInputField(document.activeElement)) {
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

    // Check which modifier keys are pressed
    const hasShift = event.shiftKey;
    const hasCtrl = event.ctrlKey;
    const hasAlt = event.altKey;
    const hasMeta = event.metaKey;

    // Determine if acceleration modifier is pressed
    let isAccelerationActive = false;
    if (settings.enableAcceleration) {
      switch (settings.accelerationModifier) {
        case 'shift':
          isAccelerationActive = hasShift;
          break;
        case 'ctrl':
          isAccelerationActive = hasCtrl;
          break;
        case 'alt':
          isAccelerationActive = hasAlt;
          break;
        case 'meta':
          isAccelerationActive = hasMeta;
          break;
      }
    }

    // Check if non-acceleration modifier keys are pressed
    const hasOtherModifiers =
      (settings.accelerationModifier !== 'shift' && hasShift) ||
      (settings.accelerationModifier !== 'ctrl' && hasCtrl) ||
      (settings.accelerationModifier !== 'alt' && hasAlt) ||
      (settings.accelerationModifier !== 'meta' && hasMeta);

    // Don't trigger if other modifier keys are pressed (to avoid conflicts with browser shortcuts)
    if (hasOtherModifiers) {
      return;
    }

    // Prevent default behavior and stop all event propagation immediately
    event.preventDefault();

    // Calculate scroll amount with acceleration if active
    const scrollMultiplier = isAccelerationActive ? settings.accelerationMultiplier : 1;
    const scrollDistance = settings.scrollAmount * scrollMultiplier;

    // Determine scroll direction
    const direction = isScrollDown ? 1 : -1;
    const finalDistance = scrollDistance * direction;

    const target = getScrollTarget(event.target);

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
