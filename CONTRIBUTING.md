# Contributing

Thanks for helping. Issues and pull requests are welcome.

## Setup

The project uses Node 24 (see `.nvmrc`) and npm.

```bash
source ~/.nvm/nvm.sh && nvm use
npm ci
npx playwright install chromium   # once, for the e2e tests
```

## Before opening a PR

```bash
source ~/.nvm/nvm.sh && nvm use && npm run check && npm run test:e2e
```

`npm run check` runs lint, typecheck, unit tests, build and the size budget (IIFE bundle at most 18 KB gzip, pre-paint snippet at most 1.2 KB gzip). `npm run dev` serves the demo pages (`demo/`).

## Rules

- **Commit style:** short imperative subject (`Fix focus return after Escape`), a body when the why is not obvious. One logical change per commit.
- **Logical CSS only** in the widget and in `src/styles/effects.css`: `inset-inline-start`, `margin-inline-end`, `padding-block`, never `left`, `right`, `margin-left`, `padding-right`.
- **Hebrew copy:** Hebrew is the reference locale. Address users in the gender-neutral plural («בחרו», «התאימו»), never masculine singular. Every string key must exist in all four locales (`he`, `en`, `ar`, `ru`); a unit test checks parity.
- **No network, no cookies, no tracking, no runtime dependencies.** The widget must stay private by construction.
- **No overclaiming.** Do not write that the widget "makes a site compliant" or "100% accessible". Keep the compliance disclaimer in the docs.
- **The widget itself must stay WCAG 2.1 AA.** New controls need a visible focus state, a 44x44 px target, an accessible name and a live-region announcement, and the axe e2e checks must stay clean.
- **Self-contained pre-paint code:** `normalizeState` and `applyAttrs` are stringified into the pre-paint snippet, so they must not import anything or reference module state.
