import type { NagishState } from "./state";

/**
 * Mirrors the state onto <html> as data-nagish-* attributes.
 * SELF-CONTAINED: stringified into the pre-paint snippet. No imports, no module-level references.
 * Boolean attributes are present with an empty value when true and removed when false.
 */
export function applyAttrs(state: NagishState, root?: HTMLElement): void {
  const el = root || document.documentElement;
  el.setAttribute("data-nagish-text", String(state.textScale));
  el.setAttribute("data-nagish-contrast", state.contrast);
  const bools: [string, boolean][] = [
    ["data-nagish-grayscale", state.grayscale],
    ["data-nagish-links", state.underlineLinks],
    ["data-nagish-headings", state.highlightHeadings],
    ["data-nagish-font", state.readableFont],
    ["data-nagish-spacing", state.textSpacing],
    ["data-nagish-motion", state.stopMotion],
    ["data-nagish-cursor", state.bigCursor],
    ["data-nagish-guide", state.readingGuide],
  ];
  for (let i = 0; i < bools.length; i++) {
    if (bools[i][1]) el.setAttribute(bools[i][0], "");
    else el.removeAttribute(bools[i][0]);
  }
}

/** Removes every data-nagish-* state attribute from <html>. Not used by the pre-paint snippet. */
export function clearAttrs(root: HTMLElement = document.documentElement): void {
  for (const name of root.getAttributeNames()) {
    if (name.startsWith("data-nagish-")) root.removeAttribute(name);
  }
}
