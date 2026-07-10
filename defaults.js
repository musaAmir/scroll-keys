// Shared default settings – loaded by both content.js and options.js
const DEFAULT_SETTINGS = {
  scrollDownKey: 'j',
  scrollUpKey: 'k',
  scrollAmount: 100,
  smoothScroll: true,
  scrollDuration: 200,
  enableAcceleration: true,
  accelerationModifier: 'shift',
  accelerationMultiplier: 3
};

const VALID_ACCELERATION_MODIFIERS = new Set(['shift', 'ctrl', 'alt', 'meta']);

// Normalise key values so stored settings and event.key can be compared reliably.
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

function isSupportedScrollKey(key) {
  if (typeof key !== 'string') return false;

  const normalized = normalizeKey(key);
  return (
    Array.from(key).length === 1 ||
    ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'space'].includes(normalized)
  );
}

// Treat synchronized values as untrusted input. This also protects users who
// upgrade from an older release with incomplete or malformed settings.
function sanitizeSettings(values = {}) {
  const sanitized = { ...DEFAULT_SETTINGS };

  if (isSupportedScrollKey(values.scrollDownKey)) {
    sanitized.scrollDownKey = values.scrollDownKey;
  }
  if (isSupportedScrollKey(values.scrollUpKey)) {
    sanitized.scrollUpKey = values.scrollUpKey;
  }
  if (normalizeKey(sanitized.scrollDownKey) === normalizeKey(sanitized.scrollUpKey)) {
    sanitized.scrollDownKey = DEFAULT_SETTINGS.scrollDownKey;
    sanitized.scrollUpKey = DEFAULT_SETTINGS.scrollUpKey;
  }

  if (Number.isFinite(values.scrollAmount) && values.scrollAmount >= 10 && values.scrollAmount <= 1000) {
    sanitized.scrollAmount = values.scrollAmount;
  }
  if (typeof values.smoothScroll === 'boolean') {
    sanitized.smoothScroll = values.smoothScroll;
  }
  if (
    Number.isFinite(values.scrollDuration) &&
    values.scrollDuration >= 50 &&
    values.scrollDuration <= 500
  ) {
    sanitized.scrollDuration = values.scrollDuration;
  }
  if (typeof values.enableAcceleration === 'boolean') {
    sanitized.enableAcceleration = values.enableAcceleration;
  }
  if (VALID_ACCELERATION_MODIFIERS.has(values.accelerationModifier)) {
    sanitized.accelerationModifier = values.accelerationModifier;
  }
  if (
    Number.isFinite(values.accelerationMultiplier) &&
    values.accelerationMultiplier >= 1.5 &&
    values.accelerationMultiplier <= 10
  ) {
    sanitized.accelerationMultiplier = values.accelerationMultiplier;
  }

  return sanitized;
}
