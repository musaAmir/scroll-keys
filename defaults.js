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
