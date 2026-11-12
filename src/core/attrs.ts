import type { NagishonState } from "./state";

/**
 * Mirrors the state onto <html> as data-nagishon-* attributes.
 * SELF-CONTAINED: stringified into the pre-paint snippet. No imports, no module-level references.
 * Boolean attributes are present with an empty value when true and removed when false.
 */
export function applyAttrs(state: NagishonState, root?: HTMLElement): void {
  const el = root || document.documentElement;
  el.setAttribute("data-nagishon-text", String(state.textScale));
  el.setAttribute("data-nagishon-contrast", state.contrast);
  const bools: [string, boolean][] = [
    ["data-nagishon-grayscale", state.grayscale],
    ["data-nagishon-links", state.underlineLinks],
    ["data-nagishon-headings", state.highlightHeadings],
    ["data-nagishon-font", state.readableFont],
    ["data-nagishon-spacing", state.textSpacing],
    ["data-nagishon-motion", state.stopMotion],
    ["data-nagishon-cursor", state.bigCursor],
    ["data-nagishon-guide", state.readingGuide],
  ];
  for (let i = 0; i < bools.length; i++) {
    if (bools[i][1]) el.setAttribute(bools[i][0], "");
    else el.removeAttribute(bools[i][0]);
  }
}

/** Removes every data-nagishon-* state attribute from <html>. Not used by the pre-paint snippet. */
export function clearAttrs(root: HTMLElement = document.documentElement): void {
  for (const name of root.getAttributeNames()) {
    if (name.startsWith("data-nagishon-")) root.removeAttribute(name);
  }
}
