# Changelog

## 1.0.0 — Unreleased

First release.

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
