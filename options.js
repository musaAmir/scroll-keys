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
  if (enableAccelerationCheckbox.checked) {
    accelerationSettingsDiv.classList.remove('disabled');
  } else {
    accelerationSettingsDiv.classList.add('disabled');
  }
}

// Toggle scroll duration setting visibility
function toggleScrollDurationSetting() {
  if (smoothScrollCheckbox.checked) {
    scrollDurationSettingDiv.classList.remove('disabled');
  } else {
    scrollDurationSettingDiv.classList.add('disabled');
  }
}

// Load saved settings
function loadSettings() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (result) => {
    scrollDownKeyInput.value = result.scrollDownKey;
    scrollUpKeyInput.value = result.scrollUpKey;
    scrollAmountInput.value = result.scrollAmount;
    smoothScrollCheckbox.checked = result.smoothScroll;
    scrollDurationInput.value = result.scrollDuration;
    enableAccelerationCheckbox.checked = result.enableAcceleration;
    accelerationModifierSelect.value = result.accelerationModifier;
    accelerationMultiplierInput.value = result.accelerationMultiplier;
    toggleAccelerationSettings();
    toggleScrollDurationSetting();
  });
}

// Save settings
function saveSettings() {
  const settings = {
    scrollDownKey: scrollDownKeyInput.value || DEFAULT_SETTINGS.scrollDownKey,
    scrollUpKey: scrollUpKeyInput.value || DEFAULT_SETTINGS.scrollUpKey,
    scrollAmount: parseInt(scrollAmountInput.value) || DEFAULT_SETTINGS.scrollAmount,
    smoothScroll: smoothScrollCheckbox.checked,
    scrollDuration: parseInt(scrollDurationInput.value) || DEFAULT_SETTINGS.scrollDuration,
    enableAcceleration: enableAccelerationCheckbox.checked,
    accelerationModifier: accelerationModifierSelect.value,
    accelerationMultiplier: parseFloat(accelerationMultiplierInput.value) || DEFAULT_SETTINGS.accelerationMultiplier
  };

  // Validate that keys are different
  if (settings.scrollDownKey === settings.scrollUpKey) {
    showStatus('Scroll up and down keys must be different!', 'error');
    return;
  }

  // Validate scroll amount
  if (settings.scrollAmount < 10 || settings.scrollAmount > 1000) {
    showStatus('Scroll amount must be between 10 and 1000 pixels!', 'error');
    return;
  }

  // Validate scroll duration
  if (settings.scrollDuration < 50 || settings.scrollDuration > 500) {
    showStatus('Scroll duration must be between 50 and 500 milliseconds!', 'error');
    return;
  }

  // Validate acceleration multiplier
  if (settings.accelerationMultiplier < 1.5 || settings.accelerationMultiplier > 10) {
    showStatus('Acceleration multiplier must be between 1.5 and 10!', 'error');
    return;
  }

  chrome.storage.sync.set(settings, () => {
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
    e.preventDefault();

    // Get the key value
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
