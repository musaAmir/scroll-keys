# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Chrome Extension (Manifest V3) that maps customizable keys to page scrolling. Pure vanilla JS — no package.json, no build step, no test suite, no framework.

## Development workflow

- **Run locally**: load the repo root as an unpacked extension (`chrome://extensions` → Developer mode → Load unpacked → select this folder). After editing, hit the reload button on the extension card; content-script changes also require reloading any open tabs.
- **Options page**: click the toolbar icon, or right-click it → Options. Opens `options.html` in a tab (configured via `options_ui.open_in_tab`).
- **Debugging**:
  - `content.js` logs go to the **page's** DevTools console (not the extension's).
  - `background.js` logs go to the service worker inspector, reachable from `chrome://extensions` → "Service worker" link on this extension.
- **Packaging**: the `dist/` zips are produced manually and git-ignored. There is no packaging script.

## Architecture

Three execution contexts, each isolated by Chrome's extension model:

1. **Content script** (`defaults.js` + `content.js`) — injected into every page at `document_end`. `defaults.js` must be listed **before** `content.js` in `manifest.json`; there is no module system, so `DEFAULT_SETTINGS` and `normalizeKey` are shared via the global scope of the content-script's isolated world.
2. **Options page** (`options.html` + `defaults.js` + `options.js`) — reuses the same `defaults.js` the same way (global `DEFAULT_SETTINGS`, `normalizeKey`). Keep `defaults.js` dependency-free so both contexts can load it as a plain script.
3. **Service worker** (`background.js`) — minimal; only re-opens the options page on action click. The toolbar action has no popup (`manifest.json` defines no `default_popup`), so the click handler is what makes the icon do anything.

Settings flow: `options.js` writes to `chrome.storage.sync` → `content.js` picks up changes live via `chrome.storage.onChanged` (filtered to the `sync` namespace). Never read settings synchronously at event time — always mutate the in-memory `settings` object from the change listener.

### Content-script hot paths (non-obvious)

- **Capture-phase keydown listener** (`addEventListener(..., true)`). This is deliberate — some sites attach their own bubbling-phase handlers that would otherwise swallow `j`/`k`. Preserve the capture phase when touching the listener.
- **Input-field detection** (`isInputField`) walks ancestors and checks: `<textarea>`, `<select>`, `<input>` with a text-like `type` (see `TEXT_INPUT_TYPES`), `isContentEditable`, `role="textbox"|"searchbox"`, and `document.designMode === 'on'`. It's called on both `event.composedPath()[0]` and `getActiveElement()` because some sites wrap inputs in containers that receive the event before the real input. Shadow DOM is traversed via `getRootNode()`/`ShadowRoot.host` and `shadowRoot.activeElement` chaining.
- **Scroll target resolution** (`getScrollTarget`) walks up from the event origin looking for the nearest ancestor whose computed `overflow-y` is `auto`/`scroll`/`overlay` **and** whose `scrollHeight > clientHeight + 1`. Falls back to `document.scrollingElement`, then `window`. This is why the extension works inside modal dialogs and embedded scrollable panes, not just the page root — don't "simplify" it to `window.scrollBy`.
- **Smooth scroll** (`smoothScrollBy`) is a hand-rolled `requestAnimationFrame` loop with `easeOutQuad`. It writes to `window.scrollTo` for the window target and `target.scrollTop` for element targets — these branches are not interchangeable. `currentAnimation` is cancelled on each new keypress so rapid taps don't queue.
- **Modifier handling**: the acceleration modifier (default `shift`) multiplies the scroll amount; **any other modifier** (ctrl/alt/meta when not configured as the accelerator) aborts the handler so browser shortcuts (Ctrl-F, Cmd-R, etc.) keep working. `normalizeKey` collapses arrow-key names and space variants so stored settings and `event.key` compare reliably.

## Conventions

- Keep everything ES5/ES2017-compatible vanilla JS. No bundler, no TypeScript, no npm dependencies.
- Add new runtime files to `manifest.json` (`content_scripts.js` array or `options.html` `<script>` tags) — there is no auto-discovery.
- `manifest.json` currently requests only the `storage` permission. Any new API surface (tabs, scripting, host permissions) must be added there explicitly and is worth calling out in review.
