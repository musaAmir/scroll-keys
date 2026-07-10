// Get DOM elements
const scrollDownKeyInput = document.getElementById('scrollDownKey');
const scrollUpKeyInput = document.getElementById('scrollUpKey');
const scrollAmountInput = document.getElementById('scrollAmount');
const smoothScrollCheckbox = document.getElementById('smoothScroll');
const scrollDurationInput = document.getElementById('scrollDuration');
const scrollDurationSettingDiv = document.getElementById('scrollDurationSetting');
const enableAccelerationCheckbox = document.getElementById('enableAcceleration');
const accelerationModifierSelect = document.getElementById('accelerationModifier');
const accelerationMultiplierInput = document.getElementById('accelerationMultiplier');
const accelerationSettingsDiv = document.getElementById('accelerationSettings');
const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');
const status = document.getElementById('status');

// Toggle acceleration settings visibility
function toggleAccelerationSettings() {
  const isEnabled = enableAccelerationCheckbox.checked;
  accelerationSettingsDiv.classList.toggle('disabled', !isEnabled);
  accelerationSettingsDiv.setAttribute('aria-disabled', String(!isEnabled));
  accelerationModifierSelect.disabled = !isEnabled;
  accelerationMultiplierInput.disabled = !isEnabled;
}

// Toggle scroll duration setting visibility
function toggleScrollDurationSetting() {
  const isEnabled = smoothScrollCheckbox.checked;
  scrollDurationSettingDiv.classList.toggle('disabled', !isEnabled);
  scrollDurationSettingDiv.setAttribute('aria-disabled', String(!isEnabled));
  scrollDurationInput.disabled = !isEnabled;
}

// Load saved settings
function loadSettings() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (result) => {
    if (chrome.runtime.lastError) {
      showStatus(`Could not load settings: ${chrome.runtime.lastError.message}`, 'error');
      return;
    }

    const settings = sanitizeSettings(result);
    scrollDownKeyInput.value = settings.scrollDownKey;
    scrollUpKeyInput.value = settings.scrollUpKey;
    scrollAmountInput.value = settings.scrollAmount;
    smoothScrollCheckbox.checked = settings.smoothScroll;
    scrollDurationInput.value = settings.scrollDuration;
    enableAccelerationCheckbox.checked = settings.enableAcceleration;
    accelerationModifierSelect.value = settings.accelerationModifier;
    accelerationMultiplierInput.value = settings.accelerationMultiplier;
    toggleAccelerationSettings();
    toggleScrollDurationSetting();
  });
}

// Save settings
function saveSettings() {
  const scrollDownKey = scrollDownKeyInput.value;
  const scrollUpKey = scrollUpKeyInput.value;

  if (!scrollDownKey || !scrollUpKey) {
    showStatus('Scroll up and down keys cannot be empty!', 'error');
    return;
  }

  if (!isSupportedScrollKey(scrollDownKey) || !isSupportedScrollKey(scrollUpKey)) {
    showStatus('Choose a single character, arrow key, or Space for each shortcut.', 'error');
    return;
  }

  const settings = {
    scrollDownKey,
    scrollUpKey,
    scrollAmount: Number(scrollAmountInput.value),
    smoothScroll: smoothScrollCheckbox.checked,
    scrollDuration: Number(scrollDurationInput.value),
    enableAcceleration: enableAccelerationCheckbox.checked,
    accelerationModifier: accelerationModifierSelect.value,
    accelerationMultiplier: Number(accelerationMultiplierInput.value)
  };

  // Validate that keys are different
  if (normalizeKey(settings.scrollDownKey) === normalizeKey(settings.scrollUpKey)) {
    showStatus('Scroll up and down keys must be different!', 'error');
    return;
  }

  // Validate scroll amount
  if (!Number.isFinite(settings.scrollAmount) || settings.scrollAmount < 10 || settings.scrollAmount > 1000) {
    showStatus('Scroll amount must be between 10 and 1000 pixels!', 'error');
    return;
  }

  // Validate scroll duration
  if (
    settings.smoothScroll &&
    (!Number.isFinite(settings.scrollDuration) || settings.scrollDuration < 50 || settings.scrollDuration > 500)
  ) {
    showStatus('Scroll duration must be between 50 and 500 milliseconds!', 'error');
    return;
  }

  // Validate acceleration multiplier
  if (
    settings.enableAcceleration &&
    (!Number.isFinite(settings.accelerationMultiplier) ||
      settings.accelerationMultiplier < 1.5 ||
      settings.accelerationMultiplier > 10)
  ) {
    showStatus('Acceleration multiplier must be between 1.5 and 10!', 'error');
    return;
  }

  // Keep inactive settings valid so re-enabling a feature never exposes a
  // malformed synchronized value.
  if (
    !settings.smoothScroll &&
    (!Number.isFinite(settings.scrollDuration) || settings.scrollDuration < 50 || settings.scrollDuration > 500)
  ) {
    settings.scrollDuration = DEFAULT_SETTINGS.scrollDuration;
  }
  if (
    !settings.enableAcceleration &&
    (!Number.isFinite(settings.accelerationMultiplier) ||
      settings.accelerationMultiplier < 1.5 ||
      settings.accelerationMultiplier > 10)
  ) {
    settings.accelerationMultiplier = DEFAULT_SETTINGS.accelerationMultiplier;
  }

  chrome.storage.sync.set(settings, () => {
    if (chrome.runtime.lastError) {
      showStatus(`Could not save settings: ${chrome.runtime.lastError.message}`, 'error');
      return;
    }
    showStatus('Settings saved successfully!', 'success');
  });
}

// Reset to default settings
function resetSettings() {
  scrollDownKeyInput.value = DEFAULT_SETTINGS.scrollDownKey;
  scrollUpKeyInput.value = DEFAULT_SETTINGS.scrollUpKey;
  scrollAmountInput.value = DEFAULT_SETTINGS.scrollAmount;
  smoothScrollCheckbox.checked = DEFAULT_SETTINGS.smoothScroll;
  scrollDurationInput.value = DEFAULT_SETTINGS.scrollDuration;
  enableAccelerationCheckbox.checked = DEFAULT_SETTINGS.enableAcceleration;
  accelerationModifierSelect.value = DEFAULT_SETTINGS.accelerationModifier;
  accelerationMultiplierInput.value = DEFAULT_SETTINGS.accelerationMultiplier;
  toggleAccelerationSettings();
  toggleScrollDurationSetting();

  chrome.storage.sync.set(DEFAULT_SETTINGS, () => {
    if (chrome.runtime.lastError) {
      showStatus(`Could not reset settings: ${chrome.runtime.lastError.message}`, 'error');
      return;
    }
    showStatus('Settings reset to default!', 'success');
  });
}

// Show status message
function showStatus(message, type) {
  status.textContent = message;
  status.className = `status ${type} show`;

  setTimeout(() => {
    status.classList.remove('show');
  }, 3000);
}

// Handle key input (allow only single characters)
function handleKeyInput(input) {
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      return;
    }

    e.preventDefault();

    if (e.key === 'Backspace' || e.key === 'Delete') {
      input.value = '';
      return;
    }

    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Escape'].includes(e.key)) {
      return;
    }

    let key = e.key;

    // Handle special keys
    if (key === 'ArrowUp') key = '↑';
    if (key === 'ArrowDown') key = '↓';
    if (key === 'ArrowLeft') key = '←';
    if (key === 'ArrowRight') key = '→';
    if (key === ' ') key = 'Space';

    // Only accept single character keys or special arrow keys
    if (key.length === 1 || ['↑', '↓', '←', '→', 'Space'].includes(key)) {
      input.value = key;
    }
  });

  // Prevent pasting
  input.addEventListener('paste', (e) => {
    e.preventDefault();
  });
}

// Event listeners
saveBtn.addEventListener('click', saveSettings);
resetBtn.addEventListener('click', resetSettings);
smoothScrollCheckbox.addEventListener('change', toggleScrollDurationSetting);
enableAccelerationCheckbox.addEventListener('change', toggleAccelerationSettings);

// Setup key input handlers
handleKeyInput(scrollDownKeyInput);
handleKeyInput(scrollUpKeyInput);

// Allow Enter to save
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && document.activeElement !== scrollDownKeyInput && document.activeElement !== scrollUpKeyInput) {
    saveSettings();
  }
});

// Load settings on page load
loadSettings();
