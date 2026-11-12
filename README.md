# nagishon (נגישון)

[![CI](https://github.com/zloto-labs/nagishon/actions/workflows/ci.yml/badge.svg)](https://github.com/zloto-labs/nagishon/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/nagishon.svg)](https://www.npmjs.com/package/nagishon)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/nagishon)](https://bundlephobia.com/package/nagishon)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**בעברית:** `nagishon` הוא תפריט נגישות חינמי בקוד פתוח (MIT) לאתרים, בעברית ומימין לשמאל כברירת מחדל. הוא נותן למבקרים שליטה בגודל הטקסט, בניגודיות, בריווח, בתנועה ועוד, ומקשר להצהרת הנגישות שלכם. הוא פועל בלי שרת, בלי עוגיות ובלי מעקב. חשוב: התפריט הוא כלי עזר למשתמשים ואינו הופך אתר לנגיש או לעומד בדרישות החוק. [README מלא בעברית](README.he.md).

A free, MIT-licensed, framework-agnostic accessibility toolbar (תפריט נגישות) for websites. Hebrew and RTL first, with English, Arabic and Russian built in. Vanilla TypeScript, zero runtime dependencies, no network requests, no cookies.

## What it is, and what it is not

**It is** a user-facing toolbar. Visitors open a "נגישות" button and adjust the page to their needs: text size (100%–200%), dark or light contrast, grayscale, link underlines, heading highlights, a readable font, WCAG 1.4.12 text spacing, stop motion, a large cursor and a reading guide. Choices are stored in the visitor's browser (`localStorage`) and nothing is sent anywhere. The toolbar also links to your accessibility statement and a contact channel.

**It is not** a way to make a site compliant. A toolbar cannot fix missing alt text, unlabeled form fields, broken heading structure, keyboard traps or low-contrast design, and it does not replace Israeli Standard ת"י 5568 (WCAG-based) conformance of the site itself. Installing it does not by itself satisfy the Equal Rights for Persons with Disabilities regulations. Treat it as a convenience layer on top of an accessible site.

- Legal background (Hebrew, not legal advice): [docs/research/israel-accessibility-law.he.md](docs/research/israel-accessibility-law.he.md)
- What the site owner still has to do: [docs/compliance-checklist.he.md](docs/compliance-checklist.he.md)
- Accessibility statement template: [docs/accessibility-statement-template.he.md](docs/accessibility-statement-template.he.md)

## 30-second install

Add one line before `</body>`:

```html
<script src="https://cdn.jsdelivr.net/npm/nagishon@1/dist/nagishon.iife.js" defer data-nagishon data-statement-url="/accessibility"></script>
```

Optional, avoids a flash of unstyled settings on repeat visits. Put this **in `<head>`**, synchronous (no `defer`, no `async`); it applies the saved settings before first paint:

```html
<script src="https://cdn.jsdelivr.net/npm/nagishon@1/dist/prepaint.js"></script>
```

Data attributes understood by the script tag: `data-locale`, `data-position`, `data-statement-url`, `data-contact-url`, `data-hotkey`, `data-text-scaling`, `data-skip-link` (a selector, e.g. `#main`), `data-accent`, `data-z-index`, `data-features` (comma-separated list of the only features to enable, e.g. `textScale,contrast`), and `data-nagishon-manual` to skip auto-init and call `Nagishon.init()` yourself.

```html
<script>
  Nagishon.init({ locale: "he", statementUrl: "/accessibility", skipLink: { target: "#main" } });
</script>
```

## npm / ESM

```bash
npm install nagishon
```

```ts
import { init } from "nagishon";

const nagishon = init({
  statementUrl: "/accessibility",
  contactUrl: "mailto:accessibility@your-domain.example",
  skipLink: { target: "#main" },
});
```

`init()` is idempotent: a second call returns the existing instance. Call `nagishon.destroy()` to remove it.

## Next.js (App Router)

```tsx
// app/layout.tsx
import { NAGISHON_PREPAINT } from "nagishon/prepaint";
import { NagishonWidget } from "nagishon/react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <script dangerouslySetInnerHTML={{ __html: NAGISHON_PREPAINT }} />
      </head>
      <body>
        {children}
        <NagishonWidget statementUrl="/accessibility" />
      </body>
    </html>
  );
}
```

`nagishon/react` already carries `"use client"`, so you can import it from a Server Component. The widget renders nothing on the server and mounts after hydration. If you suppress hydration warnings for the `<html>` element, note that the pre-paint script sets `data-nagishon-*` attributes on it before React hydrates (`suppressHydrationWarning` on `<html>` is the usual fix).

## React / Vite

```tsx
import { NagishonWidget, useNagishon } from "nagishon/react";

export function App() {
  return (
    <>
      <NagishonWidget statementUrl="/accessibility" skipLink={{ target: "#main" }} />
      <main id="main">...</main>
      <OpenButton />
    </>
  );
}

function OpenButton() {
  const { state, open } = useNagishon();
  return <button onClick={open}>Accessibility (text {state.textScale * 100}%)</button>;
}
```

`useNagishon()` returns `{ state, set, setState, reset, open, close, instance }`, is SSR-safe, and subscribes to the instance's `change` event. To use your own button, render `<NagishonWidget launcher={{ hidden: true }} />` and call `open()`.

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `locale` | `"he" \| "en" \| "ar" \| "ru"` (any string falls back to `"he"`) | `"he"` | UI language. |
| `dir` | `"rtl" \| "ltr"` | from locale (`he`, `ar` are RTL) | Text direction of the widget. |
| `position` | `"start" \| "end"` | `"start"` | Logical inline side of the launcher: `start` is the right edge in RTL pages and the left edge in LTR pages. |
| `offset` | `{ block?: number; inline?: number }` | `{ block: 20, inline: 20 }` | Distance in px from the viewport edges. |
| `statementUrl` | `string` | none | Link «הצהרת נגישות». If omitted, the link is not rendered. Strongly recommended (regulation 35ה). |
| `contactUrl` | `string` | none | Optional link «דיווח על בעיית נגישות» (`mailto:`, `tel:` or `https:`). |
| `hotkey` | `string \| false` | `"Alt+Shift+A"` | Open/close shortcut, `Mod+Key` with Mod in `Alt`, `Ctrl`, `Shift`, `Meta` joined by `+`. `false` disables it. |
| `textScaling` | `"elements" \| "root"` | `"elements"` | Text size strategy, see below. |
| `skipLink` | `{ target: string; label?: string } \| false` | `false` | Injects a "skip to main content" link as the first element of `<body>`. |
| `features` | `Partial<Record<keyof NagishonState, boolean>>` | all `true` | Hide individual controls, e.g. `{ bigCursor: false }`. |
| `theme` | `Partial<{ accent: string; background: string; foreground: string; radius: string; zIndex: number }>` | built-in light/dark theme | Visual overrides, see Theming. |
| `launcher` | `{ label?: string; showText?: boolean; hidden?: boolean }` | `{ showText: true, hidden: false }` | `hidden: true` removes the built-in button; call `open()` yourself. `showText: false` shows the icon only (the accessible name comes from `label`). |
| `initialState` | `Partial<NagishonState>` | none | Applied only when the visitor has no stored state. |
| `storageKey` | `string` | `"nagishon:v1"` | `localStorage` key. If you change it, pass the same key to the pre-paint script (`prepaintScript(key)` from `nagishon/prepaint`). |
| `onChange` | `(state: NagishonState) => void` | none | Called after every change. |

State keys: `textScale` (1, 1.25, 1.5, 1.75, 2), `contrast` (`"none" | "dark" | "light"`), `grayscale`, `underlineLinks`, `highlightHeadings`, `readableFont`, `textSpacing`, `stopMotion`, `bigCursor`, `readingGuide` (booleans). The reading guide is offered on pointer devices only.

## Instance API

```ts
const nagishon = init();
nagishon.open(); nagishon.close(); nagishon.toggle();
nagishon.getState();                    // NagishonState
nagishon.set("contrast", "dark");       // one key
nagishon.setState({ textScale: 1.5, underlineLinks: true });
nagishon.reset();                       // back to defaults, storage key removed
const off = nagishon.on("change", (state) => console.log(state)); // also "open" and "close"
off();
nagishon.destroy();                     // removes DOM, listeners, observers; storage is left intact
```

`get()` returns the current instance or `null`. In the script-tag build the same functions live on `window.Nagishon` (`init`, `get`, `version`).

## Events

The widget dispatches events on `window`:

- `nagishon:ready`: after initialisation.
- `nagishon:change`: on every state change, with the state in `event.detail`.

```js
window.addEventListener("nagishon:change", (e) => console.log(e.detail.textScale));
```

## Theming

Pass the `theme` option; values are plain CSS values.

```ts
init({ theme: { accent: "#0b4aa8", radius: "8px", zIndex: 10000 } });
```

Keep contrast in mind: text on your `accent` and `background` colors should reach 4.5:1 and UI boundaries 3:1. The widget picks a dark variant automatically with `prefers-color-scheme: dark`, and switches to explicit black/white/yellow colors while the page is in a high-contrast mode.

## Text size: choosing a strategy

| Strategy | How it works | Good for | Trade-offs |
|---|---|---|---|
| `elements` (default) | Reads each text element's computed `font-size` once and sets a scaled `font-size` (and a px `line-height`) inline. A `MutationObserver` scales content added later. Restores the original inline values at 100%. | Sites with px or mixed units, page builders, anything where the root size is not the base of the layout. | Touches many elements (work is chunked to avoid jank); inline `font-size` takes priority over your CSS while active. |
| `root` | Sets a scaled `font-size` on `html`. | Sites built with `rem`/`em` throughout. Cheapest and cleanest. | Does nothing for text sized in `px`. |

The dialog itself lives in the Shadow DOM, is not scaled by either strategy, and honors browser zoom.

Also note: the grayscale mode uses `filter: grayscale(1)` on `<html>`. A `filter` on the root creates a containing block for `position: fixed` descendants, which can shift fixed elements on some pages. If that matters on your site, hide the grayscale control with `features: { grayscale: false }`.

## Privacy

No network requests, no cookies, no analytics, no external fonts. The only storage is `localStorage` under `nagishon:v1` (removed when settings return to defaults). Settings sync across tabs of the same origin via the `storage` event.

## Accessibility of the widget itself

The widget is built to meet WCAG 2.1 AA, and that is checked automatically, not assumed:

- axe-core (tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`) runs in Playwright on the demo page with the dialog closed, open, open with the page in dark contrast, and in the English LTR locale.
- Scripted keyboard tests cover: Tab reaches the launcher, Enter opens, focus moves to the dialog title, Tab and Shift+Tab stay inside the dialog, Escape closes and returns focus, the `Alt+Shift+A` hotkey, and the skip link.
- Tests check that every control changes the matching `data-nagishon-*` attribute and `aria-checked`/`aria-pressed` state, that settings persist before first paint, and that reset clears everything.
- The widget is rendered in a Shadow DOM and the demo page ships hostile CSS (`button, a { all: unset }`, a tiny base font) to verify isolation.
- Controls are at least 44x44 px, focus is always visible, changes are announced in an `aria-live="polite"` region, and the page behind the dialog is made inert while it is open.

Automated tests do not find everything. Please report anything you hit with a screen reader or other assistive technology as an issue.

## Israeli compliance notes

These notes are a summary, not legal advice; see [the research document](docs/research/israel-accessibility-law.he.md) for sources.

- **Accessibility statement (regulation 35ה):** the statement must be published in a prominent place on the site. Link it from the footer of every page and pass `statementUrl` so the toolbar links to it too. A fill-in template is in [docs/accessibility-statement-template.he.md](docs/accessibility-statement-template.he.md). Only state facts that are true; do not claim an audit that did not happen.
- **Contact channel and the 60-day cure period (35א(ד)):** provide a working way for people to report an inaccessible part of the site (pass `contactUrl`) and respond to reports. A deviation from the standard is generally not treated as a violation unless a notice was sent and it was not fixed within 60 days, and meanwhile you should offer an alternative way to get the service.
- **Everything else is on the site itself:** use [docs/compliance-checklist.he.md](docs/compliance-checklist.he.md) (alt text, labels, heading structure, keyboard access, contrast, captions where required, periodic review).

## Browser support

The last 2 versions of Chrome, Edge, Firefox and Safari (desktop), and Safari on iOS 16 and later. No Internet Explorer.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). In short: Node 24, `npm run check && npm run test:e2e`, logical CSS properties only, gender-neutral plural Hebrew copy. Security reports: [SECURITY.md](SECURITY.md). Release notes: [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE) © 2026 zloto-labs
