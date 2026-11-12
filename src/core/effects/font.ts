const ICON_RE = /icon|font ?awesome|material|glyph|symbols?|fontello|ionicons/i;
const MARK = "data-nagish-keep-font";
const ATTR = "data-nagish-font";

/**
 * Marks elements using icon fonts so the "readable font" rule leaves them alone.
 * The font override (possibly already applied by the pre-paint snippet) is lifted for the duration of
 * one synchronous read pass, so computed families are the page's own. No paint happens in between.
 */
export function markIconFonts(): void {
  const html = document.documentElement;
  const had = html.hasAttribute(ATTR);
  if (had) html.removeAttribute(ATTR);
  try {
    const marks: Element[] = [];
    document.body.querySelectorAll("*").forEach((el) => {
      if (el.closest("[data-nagish-root]")) return;
      const family = getComputedStyle(el).fontFamily;
      if (family && ICON_RE.test(family)) marks.push(el);
    });
    marks.forEach((el) => el.setAttribute(MARK, ""));
  } finally {
    if (had) html.setAttribute(ATTR, "");
  }
}

export function unmarkIconFonts(): void {
  document.querySelectorAll(`[${MARK}]`).forEach((el) => el.removeAttribute(MARK));
}
