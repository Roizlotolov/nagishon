# nagishon — technical specification (v1)

`nagishon` (נגיש) is a free, MIT-licensed, framework-agnostic accessibility toolbar ("תפריט נגישות") for websites, Hebrew/RTL-first, built for the Israeli market (ת"י 5568 / WCAG AA context, see `docs/research/israel-accessibility-law.he.md`).

This document is the contract for implementation. Anything not specified here is left to the implementer, but every "MUST" is a gate.

## 0. Non-negotiables

- **Honest positioning.** The widget does not make a site compliant. README, demo and statement template say so explicitly. No "100% compliant" claims anywhere.
- **Privacy.** No network requests, no cookies, no analytics, no external fonts. State lives in `localStorage` only.
- **Zero runtime dependencies.** Vanilla TypeScript. The React entry depends only on `react` as a peer dependency.
- **Size budget.** IIFE bundle (all locales + CSS) ≤ 18 KB gzip. Pre-paint snippet ≤ 1.2 KB minified. Enforced by `size-limit` in CI.
- **The widget itself is WCAG 2.1 AA conformant.** Verified with axe-core in Playwright, plus scripted keyboard tests.
- **Hebrew first.** Default locale `he`, `dir="rtl"`. Gender-neutral plural Hebrew address (e.g. «התאימו», «בחרו»), never masculine singular.
- **Logical CSS only** inside the widget (`inset-inline-end`, `margin-inline-start`, `padding-block`), never `left/right/margin-left`.
- **Node 24** (`.nvmrc`), npm. `source ~/.nvm/nvm.sh && nvm use` before any command.
- Every commit message ends with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

## 1. Deliverables and package layout

npm package name: `nagishon`. Repo: `Roizlotolov/nagishon` (GitHub).

```
nagishon/
  package.json            name "nagishon", "type":"module", MIT, sideEffects: ["*.css"], files: ["dist","README*.md","LICENSE"]
  tsconfig.json           strict, ES2020 target, DOM libs, moduleResolution bundler
  tsup.config.ts          builds every entry below
  eslint.config.js        typescript-eslint recommended + no-restricted-syntax for physical CSS props is NOT needed in TS; keep lint simple
  vitest.config.ts        environment jsdom
  playwright.config.ts    chromium only, webServer = vite preview of demo
  size-limit config       in package.json
  src/
    index.ts              public ESM API (section 4)
    iife.ts               script-tag entry: auto-init from the <script> element's data-* attributes
    prepaint.ts           exports NAGISHON_PREPAINT (string) and the source function used to build it
    react/index.tsx       "use client"; <NagishonWidget {...options} /> and useNagishon()
    core/state.ts         NagishonState type, DEFAULT_STATE, normalizeState(), storage read/write, change listeners
    core/attrs.ts         applyAttrs(state) -> sets data-nagishon-* on <html>; shared by prepaint (must be self-contained, no imports)
    core/effects/*.ts     text-scaling (elements strategy), motion (pause media), reading-guide, cursor, skip-link
    ui/widget.ts          launcher + dialog rendered inside a Shadow DOM host
    ui/widget.css         shadow styles (imported as text, injected into the shadow root)
    styles/effects.css    global page effects keyed on html[data-nagishon-*]; injected once as <style id="nagishon-effects">
    i18n/{he,en,ar,ru}.ts  + i18n/index.ts (type Locale, strings table)
  demo/
    index.html            Hebrew sample page: nav, headings, paragraphs, links, form, autoplay muted video, CSS animation, images with/without alt
    statement.html        a filled example of the statement template
    main.ts               imports from "../src" for dev; the Playwright build uses dist IIFE via a second page `iife.html`
    iife.html             uses <script src="/dist/nagishon.iife.js" data-...> to test the real bundle
  docs/
    research/israel-accessibility-law.he.md   (exists)
    plan/spec.md (this), plan/plan.md
    accessibility-statement-template.he.md    Hebrew statement template with {{placeholders}} covering reg 35ה items
    compliance-checklist.he.md                 short checklist: what the site owner still has to do (alt, labels, headings, keyboard, contrast, captions, statement, 60-day channel)
  tests/
    unit/*.test.ts        state normalize/persist, attrs, text scaling math, i18n completeness (every key in every locale)
    e2e/*.spec.ts         Playwright: axe (page + open dialog, in default and high-contrast), keyboard flow, persistence across reload, prepaint attrs present before DOMContentLoaded, each effect toggles its data attribute, hotkey, skip link, RTL/LTR by locale
  .github/workflows/ci.yml   node 24: npm ci, lint, typecheck, test:unit, build, size, test:e2e (installs chromium)
  README.md (English, with a Hebrew section at the top), README.he.md (full Hebrew), LICENSE (MIT, "zloto-labs"), CHANGELOG.md, CONTRIBUTING.md, .nvmrc, .gitignore, .editorconfig
```

Build outputs (tsup):

| entry | formats | file |
|---|---|---|
| `src/index.ts` | esm + dts | `dist/index.js`, `dist/index.d.ts` |
| `src/iife.ts` | iife, global name `Nagishon`, minified | `dist/nagishon.iife.js` |
| `src/prepaint.ts` | esm + dts, and a standalone minified `dist/prepaint.js` that just executes the snippet | |
| `src/react/index.tsx` | esm + dts, external react | `dist/react/index.js` |

`package.json#exports`:
```json
{
  ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
  "./react": { "types": "./dist/react/index.d.ts", "import": "./dist/react/index.js" },
  "./prepaint": { "types": "./dist/prepaint.d.ts", "import": "./dist/prepaint.js" },
  "./iife": "./dist/nagishon.iife.js",
  "./package.json": "./package.json"
}
```
Also `"unpkg"` and `"jsdelivr"` fields pointing to `dist/nagishon.iife.js`.

## 2. State model

```ts
export type TextScale = 1 | 1.25 | 1.5 | 1.75 | 2;
export type Contrast = "none" | "dark" | "light";   // dark = black bg / white text / yellow links; light = white bg / black text / dark-blue links
export interface NagishonState {
  textScale: TextScale;        // default 1
  contrast: Contrast;          // default "none"
  grayscale: boolean;          // default false
  underlineLinks: boolean;     // default false
  highlightHeadings: boolean;  // default false
  readableFont: boolean;       // default false  -> forces a system sans-serif stack, no bundled font
  textSpacing: boolean;        // default false  -> WCAG 1.4.12 values: line-height 1.5, letter-spacing .12em, word-spacing .16em, paragraph margin-bottom 2em
  stopMotion: boolean;         // default false  -> kills animations/transitions, pauses autoplaying media, smooth-scroll off
  bigCursor: boolean;          // default false  -> large black/white SVG cursor via data URI
  readingGuide: boolean;       // default false  -> horizontal translucent band following the pointer (pointer devices only)
}
```

- Storage key: `nagishon:v1`. Value: JSON of the state. When state equals `DEFAULT_STATE`, the key is **removed** (clean reset).
- `normalizeState(unknown): NagishonState` MUST accept garbage and return a valid state (used verbatim by the pre-paint snippet, so it must be a self-contained pure function with no imports or closures).
- Cross-tab sync via the `storage` event.
- `schemaVersion` is implied by the key suffix; a future `nagishon:v2` migrates and deletes `v1`.

## 3. Effects (how state changes the host page)

`applyAttrs(state)` sets on `document.documentElement`:
`data-nagishon-text` ("1" … "2"), `data-nagishon-contrast` ("none"|"dark"|"light"), and boolean attrs present/absent: `data-nagishon-grayscale`, `data-nagishon-links`, `data-nagishon-headings`, `data-nagishon-font`, `data-nagishon-spacing`, `data-nagishon-motion`, `data-nagishon-cursor`, `data-nagishon-guide`.
Boolean attrs are **present with empty value when true and removed when false** (so `html[data-nagishon-links]` selectors work and the pre-paint snippet stays tiny).

`styles/effects.css` (global, injected once into `<head>` as `<style id="nagishon-effects">`; if an element with that id already exists, reuse it) implements everything that CSS can:

- **Contrast dark**: `html[data-nagishon-contrast="dark"] :not(img):not(video):not(svg):not(picture):not(canvas):not(iframe):not([data-nagishon-root])` → `background-color:#000 !important; color:#fff !important; border-color:#fff !important; text-shadow:none !important; box-shadow:none !important`. Links `#ffff00`, visited `#ffc000`, focus outline `3px solid #ffff00`. Images keep their appearance. Must not break the widget itself (widget host has `data-nagishon-root` and lives in shadow DOM so inheritance is the only leak; shadow CSS sets its own colors explicitly).
- **Contrast light**: white background, `#000` text, links `#0000ee`, visited `#551a8b`, focus outline `3px solid #005a9c`.
- **Grayscale**: `html[data-nagishon-grayscale] { filter: grayscale(1) }` applied on `html` so fixed elements keep working (note: `filter` on `html` creates a containing block for fixed children; acceptable, documented).
- **Links**: `a { text-decoration: underline !important; text-decoration-thickness: 2px !important; text-underline-offset: .15em !important; }` plus a visible outline on focus.
- **Headings**: `h1..h6 { outline: 2px dashed currentColor !important; outline-offset: 4px; }` and a background tint.
- **Readable font**: `* { font-family: Arial, "Helvetica Neue", Helvetica, "Noto Sans Hebrew", "Segoe UI", Roboto, sans-serif !important; }` excluding `[data-nagishon-root]` subtree and icon fonts (skip elements whose computed font-family contains "icon" or "Font Awesome" or "Material" — do this in JS by adding `data-nagishon-keep-font` to those elements once on enable; CSS excludes `[data-nagishon-keep-font]`).
- **Text spacing**: `*:not(svg *) { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-block-end: 2em !important; }`.
- **Stop motion**: `*, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }` plus `marquee { display:none }`? No: `marquee` gets `-webkit-marquee-speed:0` is unsupported; instead JS calls `marquee.stop()` where present. JS also: `document.querySelectorAll("video[autoplay], audio[autoplay]")` → `pause()`, remove `autoplay`, set `data-nagishon-paused`; on disable, elements that were paused by nagishon and have `loop`/`muted` get `play()` again (best effort, ignore promise rejections). A MutationObserver pauses media added later while the toggle is on. CSS animations in the shadow DOM honor it too.
- **Big cursor**: `html[data-nagishon-cursor], html[data-nagishon-cursor] * { cursor: url("data:image/svg+xml,...") 4 4, auto !important }` with a 48×48 black arrow with white stroke; for links/buttons a second pointer-style SVG. Provide the SVGs as constants in TS and build the CSS string so the data URIs are URL-encoded correctly.
- **Reading guide**: JS creates one fixed `div[data-nagishon-root="guide"]` (height 12px, full inline width, `background: rgb(255 230 0 / .35)`, `border-block: 2px solid rgb(0 0 0 / .6)`, `pointer-events:none`, `z-index: 2147483646`) following `pointermove` (rAF throttled). Only created for `(pointer: fine)`; the toggle is hidden on coarse pointers.
- **Text scaling (`textScale`)**: two strategies, option `textScaling: "elements" | "root"`, default **"elements"**:
  - `root`: sets `html { font-size: calc(<original>% * scale) }` where original is the computed root size captured at first use. Best for rem-based sites.
  - `elements`: walks `document.body` descendants (excluding `[data-nagishon-root]`, `script`, `style`, `svg *`, and nodes without direct text children when `innerText` is empty), captures each element's original computed `font-size` once in a `WeakMap`, then sets `el.style.setProperty("font-size", original*scale + "px", "important")` (and `line-height` only if it was a px value, scaled the same). Scale 1 restores the original inline value (or removes the property when there was none). A `MutationObserver` on `body` (childList, subtree) scales newly added elements while scale ≠ 1. Must run in chunks (e.g. 500 elements per `requestIdleCallback`/`setTimeout(0)`) so pages with 20k nodes do not jank.
  - Both: dialog content is in the shadow DOM and keeps its own size (it is not scaled by the elements strategy) but honors browser zoom.
- **Skip link** (option `skipLink: { target: string; label?: string } | false`, default `false`): injects as first child of `body` an `<a href="#target" class="nagishon-skip">דילוג לתוכן</a>` visually hidden until focused, with styles in effects.css. If the target has no `tabindex`, set `tabindex="-1"` on it and `focus()` it on click.

All global effect rules MUST exclude the widget subtree (host element carries `data-nagishon-root`).

## 4. Public API (`src/index.ts`)

```ts
export interface NagishonOptions {
  locale?: "he" | "en" | "ar" | "ru";      // default "he"; also accepts any string and falls back to "he"
  dir?: "rtl" | "ltr";                     // default derived from locale (he/ar => rtl)
  position?: "start" | "end";              // logical inline side of the launcher; default "start" (right edge in RTL, left in LTR)
  offset?: { block?: number; inline?: number }; // px from the viewport edges, default 20 / 20
  statementUrl?: string;                   // link "הצהרת נגישות"; if omitted, the link is not rendered (README strongly recommends it; reg 35ה)
  contactUrl?: string;                     // optional second link "דיווח על בעיית נגישות" (mailto:/tel:/https:)
  hotkey?: string | false;                 // default "Alt+Shift+A" (format "Mod+Key", Mod ∈ Alt|Ctrl|Shift|Meta joined by +)
  textScaling?: "elements" | "root";       // default "elements"
  skipLink?: { target: string; label?: string } | false; // default false
  features?: Partial<Record<keyof NagishonState, boolean>>; // hide controls, default all true
  theme?: Partial<{ accent: string; background: string; foreground: string; radius: string; zIndex: number }>;
  launcher?: { label?: string; showText?: boolean; hidden?: boolean }; // hidden: no built-in launcher, host calls open()
  initialState?: Partial<NagishonState>;     // applied only when no stored state exists
  storageKey?: string;                     // default "nagishon:v1"
  onChange?: (state: NagishonState) => void;
}

export interface NagishonInstance {
  open(): void; close(): void; toggle(): void;
  getState(): NagishonState;
  set<K extends keyof NagishonState>(key: K, value: NagishonState[K]): void;
  setState(patch: Partial<NagishonState>): void;
  reset(): void;
  on(event: "change" | "open" | "close", cb: (state: NagishonState) => void): () => void;
  destroy(): void;   // removes DOM, listeners, observers; leaves storage intact
  readonly options: Readonly<Required<Pick<NagishonOptions,"locale"|"dir"|"position">>> & NagishonOptions;
}

export function init(options?: NagishonOptions): NagishonInstance;  // idempotent: a second call returns the existing instance (and logs a console.warn in dev)
export function get(): NagishonInstance | null;
export { DEFAULT_STATE, normalizeState } from "./core/state";
export type { NagishonState, NagishonOptions, NagishonInstance, TextScale, Contrast };
```

Also dispatch `window.dispatchEvent(new CustomEvent("nagishon:change", { detail: state }))` on every change, and `nagishon:ready` after init.

### IIFE auto-init (`src/iife.ts`)

Exposes `window.Nagishon = { init, get, version }`. If the current `<script>` element (`document.currentScript`) has `data-nagishon` attribute or any `data-*` option, auto-init with options parsed from data attributes: `data-locale`, `data-position`, `data-statement-url`, `data-contact-url`, `data-hotkey`, `data-text-scaling`, `data-skip-link` (target selector), `data-accent`, `data-z-index`, `data-features` (comma list to enable only these). If the script has `data-nagishon-manual`, do not auto-init. Works with `defer` and with `type="module"` fallbacks (document.currentScript is null for modules: in that case look for `script[data-nagishon]`).

Example (the README headline snippet):
```html
<script src="https://cdn.jsdelivr.net/npm/nagishon@1/dist/nagishon.iife.js" defer data-nagishon data-statement-url="/accessibility"></script>
```

### Pre-paint (`src/prepaint.ts`)

`NAGISHON_PREPAINT` is a string of an IIFE that: reads `localStorage["nagishon:v1"]` (configurable key via a `{{KEY}}` replace helper `prepaintScript(storageKey?)`), runs `normalizeState`, runs `applyAttrs`, wrapped in try/catch. Built by stringifying the same functions used at runtime (`fn.toString()`), so there is one source of truth. Unit test asserts the string has no `import`/`export`/`__` helper references and `new Function(NAGISHON_PREPAINT)` runs in jsdom and sets attributes. `dist/prepaint.js` is that IIFE as a standalone file for `<script src>` in `<head>` (must stay synchronous, no `defer`).

### React (`src/react/index.tsx`)

```tsx
"use client";
export function NagishonWidget(props: NagishonOptions): null;  // useEffect: init(props) on mount, destroy() on unmount; updates onChange ref
export function useNagishon(): { state: NagishonState; set; setState; reset; open; close; instance: NagishonInstance | null }; // subscribes via on("change"), SSR-safe (useSyncExternalStore with DEFAULT_STATE server snapshot)
export { NAGISHON_PREPAINT } from "../prepaint";
```
Next.js docs snippet: in `app/layout.tsx` render `<script dangerouslySetInnerHTML={{ __html: NAGISHON_PREPAINT }} />` in `<head>` and `<NagishonWidget statementUrl="/accessibility" />` in `<body>`.

## 5. UI specification (`src/ui/widget.ts`, `widget.css`)

Rendered inside a Shadow DOM (`mode: "open"`) attached to a `<nagishon-widget data-nagishon-root>` host appended to `body`. The host sets `lang` and `dir`. All styles live in the shadow root; the host page's CSS must not affect it (test: demo page has aggressive `button { all: unset }`-style rules and the widget still looks right).

### Launcher
- `<button type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="nagishon-dialog">` with an SVG person icon (`aria-hidden`) and the visible text «נגישות» (hideable with `launcher.showText=false`, then the accessible name comes from `aria-label`).
- Position: `position: fixed; inset-block-end: offset.block; inset-inline-{start|end}: offset.inline`. Min 48×48 px target. `z-index` default `2147483000`.
- Visible focus ring (3px, 3:1 against adjacent colors). Contrast ≥ 4.5:1 text/icon on background, in both default and dark contrast page modes (the launcher uses its own explicit colors, not inherited).
- Respects `prefers-reduced-motion` for its own hover/entry animation (no animation at all when reduced).
- Hotkey opens/closes; the hotkey is described in the dialog footer («קיצור מקלדת: Alt+Shift+A»).

### Dialog
- `<div role="dialog" aria-modal="true" aria-labelledby="nagishon-title" id="nagishon-dialog">` (do not use `<dialog>` + `showModal()` inside shadow DOM because of inconsistent top-layer/focus behaviour across browsers; implement the focus trap manually). Hidden with `hidden` attribute when closed.
- Panel anchored above the launcher on the same inline side; width `min(360px, 100vw - 24px)`; `max-block-size: calc(100svh - 24px)`; `overflow: auto`; `overscroll-behavior: contain`. On viewports < 480px width it becomes a bottom sheet full-width.
- Backdrop: `position: fixed; inset: 0; background: rgb(0 0 0 / .4)`; click closes.
- Header: `<h2 id="nagishon-title">התאמות נגישות</h2>` + close button (44×44, `aria-label="סגירה"`).
- Opening: moves focus to the title (`tabindex="-1"`). Trap: Tab/Shift+Tab cycle inside; Escape closes; closing returns focus to the launcher (or to the element that invoked `open()` when `launcher.hidden`). Page behind gets `inert` while open (feature-detect `inert`; fallback: `aria-hidden="true"` on body children except the host). Body scroll locked while open on small screens only.
- Controls:
  1. **Text size** — `<fieldset><legend>גודל טקסט</legend>` with a `role="group"` of 5 buttons «100%», «125%», «150%», «175%», «200%» using `aria-pressed`; plus «−»/«+» buttons that step. Current value announced through the live region.
  2. **Contrast** — group of 3 `aria-pressed` buttons: «רגיל», «כהה», «בהיר».
  3. Toggles (each a `<button role="switch" aria-checked>` with visible label and an icon): גווני אפור, הדגשת קישורים, הדגשת כותרות, גופן קריא, ריווח טקסט, עצירת תנועה, סמן גדול, סרגל קריאה. Switch has a visible track/thumb that does not rely on color alone (thumb position + text «פעיל/כבוי» via the live region, and ✓ glyph in the thumb when on).
  4. Footer: «איפוס כל ההתאמות» button; links: «הצהרת נגישות» (if `statementUrl`), «דיווח על בעיית נגישות» (if `contactUrl`); hotkey hint; a tiny «nagishon» credit link to the repo with `rel="noopener"` (can be hidden via `theme`? No — keep it, it is how the free project spreads; make it small, 12px, still ≥ 4.5:1).
- `<div aria-live="polite" class="sr-only">` announces changes («גודל הטקסט: 125%», «ניגודיות כהה פעילה», «איפוס בוצע»).
- Every control ≥ 44×44 px, spacing ≥ 8px. Focus visible everywhere. Font size inside the dialog: 16px base, scales with browser zoom; also offer `font-size: 1rem` so page root scaling in `root` strategy applies.
- Colors (default theme): background `#ffffff`, foreground `#111111`, accent `#0b57d0` (≥ 4.5:1 on white), focus ring `#0b57d0` with 2px white offset; dark theme auto via `prefers-color-scheme: dark` (`#1b1b1f` / `#f2f2f2` / accent `#8ab4f8` → check 4.5:1 for text, 3:1 for UI). In page contrast "dark", the dialog switches to black/white/yellow explicitly. Document the verified ratios in `docs/plan/contrast.md` (produce the numbers with a small script `scripts/check-contrast.mjs`, same approach as WCAG relative luminance formula).
- Must look correct in RTL and LTR; test both (`locale: "en"` flips to LTR, `position: "start"` stays the logical start).
- The widget renders nothing on the server (React wrapper) and tolerates being initialized before `body` exists (waits for `DOMContentLoaded`).

### i18n
Strings table with keys at least: `launcher`, `title`, `close`, `textSize`, `increase`, `decrease`, `contrast`, `contrastNone`, `contrastDark`, `contrastLight`, `grayscale`, `underlineLinks`, `highlightHeadings`, `readableFont`, `textSpacing`, `stopMotion`, `bigCursor`, `readingGuide`, `reset`, `resetDone`, `statement`, `contact`, `hotkeyHint`, `skipToContent`, `on`, `off`, `announceTextSize`, `announceOn`, `announceOff`, `poweredBy`. Hebrew is the reference; `en`, `ar`, `ru` complete. Unit test asserts key parity.

Hebrew copy (use these exactly):
launcher «נגישות»; title «התאמות נגישות»; close «סגירת התפריט»; textSize «גודל טקסט»; increase «הגדלת טקסט»; decrease «הקטנת טקסט»; contrast «ניגודיות»; contrastNone «רגילה»; contrastDark «כהה»; contrastLight «בהירה»; grayscale «גווני אפור»; underlineLinks «הדגשת קישורים»; highlightHeadings «הדגשת כותרות»; readableFont «גופן קריא»; textSpacing «ריווח טקסט»; stopMotion «עצירת תנועה»; bigCursor «סמן גדול»; readingGuide «סרגל קריאה»; reset «איפוס כל ההתאמות»; resetDone «ההתאמות אופסו»; statement «הצהרת נגישות»; contact «דיווח על בעיית נגישות»; hotkeyHint «קיצור מקלדת: {hotkey}»; skipToContent «דילוג לתוכן המרכזי»; on «פעיל»; off «כבוי»; announceTextSize «גודל הטקסט: {value}»; announceOn «{feature} פעיל»; announceOff «{feature} כבוי»; poweredBy «נבנה עם nagishon».

## 6. Demo (`demo/`)

Vite project (dev only, not published). `index.html` is a realistic Hebrew small-business page: header nav, hero with CSS animation, a `<video muted autoplay loop playsinline>` (tiny generated or public-domain file, or a `<canvas>` animation if no file ≤ 100 KB is available), paragraphs, headings h1–h3, links, a form with labels, an image with alt and a decorative image, footer with the statement link. Also includes hostile host CSS (`button, a { all: unset }`, `* { box-sizing: content-box }`, `body { font-size: 13px }`) to prove isolation. `iife.html` loads the built IIFE from `/dist` with data attributes. `statement.html` renders the template filled with placeholder business details (clearly marked placeholders, no invented company).

## 7. Tests and gates

Scripts: `dev` (vite demo), `build` (tsup), `build:demo`, `lint`, `typecheck`, `test:unit`, `test:e2e`, `test` (unit + e2e), `size`, `check` = `lint && typecheck && test:unit && build && size`, `preview`.

E2E (Playwright, chromium, against `vite preview` of the demo which copies `dist/` so `iife.html` works):
1. `axe` has zero violations (tags wcag2a, wcag2aa, wcag21a, wcag21aa) on: demo page closed; dialog open; dialog open with page contrast dark; `locale:"en"` LTR.
2. Keyboard: Tab reaches launcher, Enter opens, focus lands on title, Tab cycles inside only, Escape closes and focus returns to launcher.
3. Hotkey Alt+Shift+A opens and closes.
4. Toggling each control sets/removes its `data-nagishon-*` attribute on `html` and the switch `aria-checked` flips.
5. Text size 150% → a sample paragraph's computed font-size is 1.5× its original (elements strategy), and 100% restores it exactly.
6. Persistence: set contrast dark, reload, attribute is present **before** `DOMContentLoaded` (use `page.addInitScript` to record `document.documentElement.getAttribute("data-nagishon-contrast")` at `DOMContentLoaded` time) and the dialog shows the switch state.
7. Reset clears storage key and all attributes.
8. Stop motion pauses the autoplay video (`video.paused === true`).
9. Skip link appears on first Tab and moves focus to `#main`.
10. IIFE page: `window.Nagishon.get()` returns an instance; bundle emitted no console errors.
11. Host hostile CSS: launcher bounding box ≥ 48×48 and visible.

Unit (vitest/jsdom): normalizeState fuzz cases; storage remove-on-default; prepaint string self-contained and executable; i18n parity; hotkey parser; text scaling math and restore; options from data attributes.

CI (`.github/workflows/ci.yml`): on push and PR; Node 24; `npm ci`; `npm run check`; `npx playwright install --with-deps chromium`; `npm run test:e2e`; upload Playwright report on failure.

## 8. Documentation requirements

- `README.md`: badges (CI, npm, size, MIT), one-paragraph Hebrew summary at top, then English: what it is / what it is NOT (compliance disclaimer with a link to the research doc), 30-second install (script tag), npm/ESM, Next.js/React, options table, API, theming, accessibility of the widget itself (how it is tested), Israeli compliance notes (reg 35ה statement, 60-day channel, link to template and checklist), browser support (last 2 versions + Safari 16+), contributing, license.
- `README.he.md`: same in Hebrew, gender-neutral plural.
- `docs/accessibility-statement-template.he.md`: template with `{{שם העסק}}`, `{{כתובת האתר}}`, `{{תאריך עדכון}}`, `{{שם רכז הנגישות}}`, `{{טלפון}}`, `{{דוא"ל}}`, sections: מבוא, רמת הנגישות (ת"י 5568 / WCAG 2.1 AA), התאמות שבוצעו, תפריט הנגישות (what nagishon provides), חריגים/פטורים (optional), פנייה בנושא נגישות, רכז נגישות (if applicable), תאריך עדכון, plus a comment listing the 35ה items it satisfies. No invented facts; placeholders only.
- `docs/compliance-checklist.he.md`: 15–25 checkbox items the site owner must verify (alt, labels, headings order, keyboard, focus visible, contrast, reflow 320px, captions for video when required, forms errors, language attr, link text, no keyboard traps, statement in a prominent place, contact channel, periodic 5-year review), each with the WCAG criterion number.
- `CHANGELOG.md` starts at `1.0.0` (unreleased until published).

## 9. Browser support

Last 2 versions of Chrome, Edge, Firefox, Safari (desktop and iOS 16+). No IE. Use `:focus-visible`, `inert` with fallback, `100svh` with `100vh` fallback declared first.
