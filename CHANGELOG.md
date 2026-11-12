# Changelog

## 1.0.0 — 2026-11-12

- Panel typography is a fixed 16px base so page-level root scaling (`textScaling: "root"`) does not resize the toolbar itself; browser zoom still applies.

First release.

- Redesigned toolbar UI: pill launcher with icon, segmented text-size and contrast controls, icon rows with switches, secondary reset button. New options `launcher.shape` (`pill`/`circle`), `launcher.size` (`md`/`lg`) and `theme.preset` (`auto`/`light`/`dark`), plus matching `data-*` attributes (`data-offset-block`, `data-offset-inline`, `data-launcher-shape`, `data-launcher-size`, `data-launcher-label`, `data-theme`, `data-background`, `data-foreground`, `data-radius`).
- Accessibility toolbar (תפריט נגישות) rendered in a Shadow DOM, isolated from host page CSS.
- Text size 100%–200% (`elements` strategy by default, `root` strategy for rem-based sites).
- Contrast modes (dark, light), grayscale, link underline, heading highlight, readable font, WCAG 1.4.12 text spacing, stop motion (animations, transitions, autoplay media), large cursor, reading guide.
- Persistence in `localStorage` (`nagishon:v1`), cross-tab sync, clean reset.
- Pre-paint snippet (`nagishon/prepaint`, `dist/prepaint.js`) that applies saved settings before first paint.
- Optional skip link, configurable hotkey (default `Alt+Shift+A`), links to the accessibility statement and a contact channel.
- Locales: Hebrew (default, RTL), English, Arabic, Russian.
- Script-tag build with `data-*` auto-init (`dist/nagishon.iife.js`), ESM API, React `NagishonWidget` and `useNagishon`.
- Instance API (`open`, `close`, `toggle`, `getState`, `set`, `setState`, `reset`, `on`, `destroy`) and `nagishon:ready` / `nagishon:change` window events.
- Hebrew accessibility statement template and site-owner compliance checklist.
- No network requests, no cookies, no analytics, zero runtime dependencies.
