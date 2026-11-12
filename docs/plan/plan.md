# nagish — delivery plan and control

Owner/planner/reviewer: Fable (this session). Implementation: Sonnet agents working from `docs/plan/spec.md`. Every phase ends with a review by the planner and the gate commands below before the next phase starts.

## Phases

| # | Scope | Agent | Done when |
|---|---|---|---|
| A | Scaffold: package.json, tooling (tsup, vitest, playwright, eslint, size-limit, CI), `core/state.ts`, `core/attrs.ts`, `prepaint.ts`, `styles/effects.css`, `core/effects/*` (text scaling, motion, cursor, guide, skip link), i18n tables, unit tests for all of it | Sonnet | `npm run lint && npm run typecheck && npm run test:unit && npm run build && npm run size` exit 0 |
| B1 | UI: `ui/widget.ts` + `widget.css`, `index.ts` API, `iife.ts` auto-init, `react/index.tsx`, contrast script + `docs/plan/contrast.md` | Sonnet | builds; manual check in demo; axe clean |
| B2 | Demo pages, README (en/he), statement template, compliance checklist, CONTRIBUTING, CHANGELOG, LICENSE, e2e specs written against the spec | Sonnet (parallel with B1) | files exist; e2e specs compile |
| C | Integration: run full `npm run check && npm run test:e2e`; planner review (code read, RTL/LTR screenshots, keyboard pass, size); fix loop | Fable reviews, Sonnet fixes | all gates green |
| D | GitHub: create `zloto-labs/nagish` (public), push `main`, CI green | Fable | CI run passes |

## Gates (never push unless all exit 0, chained with `&&`)

```bash
source ~/.nvm/nvm.sh && nvm use && npm run check && npm run test:e2e
```

## Review checklist (phase C)

- [ ] Hebrew copy matches the spec exactly; gender-neutral plural; no masculine singular.
- [ ] No physical CSS properties in widget CSS (`grep -nE "\b(left|right|margin-left|margin-right|padding-left|padding-right)\s*:" src/ui/widget.css` returns nothing except `inset: 0` style shorthands).
- [ ] No network calls (`grep -rn "fetch(\|XMLHttpRequest\|navigator.sendBeacon\|<img src=\"http" src/` empty).
- [ ] Size: IIFE ≤ 18 KB gzip; prepaint ≤ 1.2 KB.
- [ ] axe zero violations in the 4 configurations.
- [ ] Keyboard-only run through every control; focus never lost; Escape and focus return work.
- [ ] Reset removes storage key and all `data-nagish-*` attributes.
- [ ] Works when host CSS is hostile (demo).
- [ ] README disclaimer present; no "compliant"/"100%" claims; no invented numbers, logos or testimonials.
- [ ] License MIT, copyright "zloto-labs".

## Out of scope for v1 (tracked for later)

- Text-to-speech / screen reader emulation (misleading; real AT is better).
- Dictionary / translation features.
- Automatic alt-text generation (would require network/AI; conflicts with privacy rule and reg 35ב expectations).
- Hosted statement generator UI (could be a static page in a later release).
- WordPress plugin wrapper (later: thin PHP wrapper that enqueues the IIFE).
