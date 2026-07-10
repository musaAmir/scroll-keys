# Keyboard Scroller

A simple and elegant browser extension that lets you scroll through websites using customizable keyboard shortcuts.

## Features

- **Simple Navigation**: Scroll up and down using keyboard keys instead of your mouse
- **Fully Customizable**: Change scroll keys to whatever you prefer
- **Adjustable Scroll Speed**: Control how far you scroll with each key press (10–1000px)
- **Smooth Scrolling**: Optional smooth scrolling animation with configurable duration
- **Scroll Acceleration**: Hold a modifier key (Shift, Ctrl, Alt, or Meta) for faster scrolling
- **Smart Detection**: Doesn't interfere with typing in input fields, textareas, or contentEditable elements
- **Scrollable Container Aware**: Automatically scrolls the nearest scrollable element, not just the page

## Default Settings

| Setting | Default |
|---------|---------|
| Scroll Down | `j` |
| Scroll Up | `k` |
| Scroll Amount | 100px |
| Smooth Scroll | Enabled |
| Animation Duration | 200ms |
| Acceleration | Enabled (Shift + key = 3x speed) |

## Installation

### Chrome Web Store

[Install Keyboard Scroller from the Chrome Web Store](https://chromewebstore.google.com/detail/keyboard-scroller/fnebfedijmclenclpnbmpfaioblknggg).

### Load unpacked for development

1. Open your browser and navigate to:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Brave: `brave://extensions/`
2. Enable **Developer mode** (toggle in the top right)
3. Click **Load unpacked**
4. Select the `scroll-keys` folder
5. The extension is now installed!

## Usage

1. Visit any website
2. Press your configured keys to scroll (default: `j` for down, `k` for up)
3. Hold the acceleration modifier (default: Shift) for faster scrolling
4. To customize settings, click the extension icon in the toolbar

## Customization

Open the settings page to configure:

- **Scroll Down / Up Keys** — any single key, including arrow keys and space
- **Base Scroll Speed** — pixels per key press (10–1000)
- **Smooth Scrolling** — toggle on/off, with adjustable animation duration (50–500ms)
- **Acceleration** — enable/disable, choose modifier key, set multiplier (1.5–10x)

## Notes

- The extension won't interfere when you're typing in text fields, textareas, or other input elements
- Non-acceleration modifier keys (Ctrl, Alt, Cmd) won't trigger scrolling, so your browser shortcuts still work
- Keys are case-insensitive

## Tech Stack

- Pure JavaScript (no frameworks)
- Chrome Extension Manifest V3
- Chrome Storage API

## Release packaging

Run `./scripts/package.sh`. The script validates the manifest and JavaScript, runs the tests, and creates a versioned upload ZIP in `dist/` with `manifest.json` at its root.

## License

MIT
