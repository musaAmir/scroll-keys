# Chrome Web Store release notes

## Suggested listing fields

- **Category:** Workflow & Planning
- **Single purpose:** Let users scroll web pages and scrollable panels with configurable keyboard shortcuts.
- **Storage permission:** Stores the user's shortcut, scroll-distance, animation, and acceleration preferences in Chrome sync storage so the settings persist and can sync between their Chrome installations.
- **Host access:** Runs the keyboard and scrolling handler on HTTP and HTTPS pages. This access is required because the extension's user-facing purpose is to scroll whichever website the user is viewing. It does not inspect, store, or transmit page contents or browsing activity.
- **Remote code:** No. All JavaScript is included in the extension package.
- **Data use:** No user data is collected or transmitted. User-selected preferences are stored only through `chrome.storage.sync`.
- **Privacy policy URL:** Use the public URL for `PRIVACY.md` in this repository.

## Version 1.0.1 release notes

- Improves scrolling reliability on complex pages and scrollable panels.
- Avoids taking over shortcuts while interactive controls are focused.
- Validates synchronized settings and reports storage errors.
- Improves settings-page accessibility.
- Limits site access to HTTP and HTTPS pages.

## Submission checklist

- Run `./scripts/package.sh` and upload `dist/keyboard-scroller-1.0.1-webstore.zip`.
- Confirm the listing description and privacy declarations match the text above.
- Confirm the privacy policy URL is publicly accessible without signing in.
- Keep at least one accurate screenshot on the listing; replace it if the settings UI has changed materially.
- Test the packaged ZIP as an unpacked extension on a normal page, a page with a nested scrollable panel, and a page with text inputs.
- Confirm developer contact details, support URL, distribution regions, and trader status in the dashboard.
- Submit only after the developer account has 2-Step Verification enabled.
