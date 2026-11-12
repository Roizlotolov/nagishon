const ARROW_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">' +
  '<path d="M6 3v34l9-8 6 14 6-3-6-13h12z" fill="#000" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></svg>';

const POINTER_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">' +
  '<path d="M18 4c-2 0-3 1-3 3v18l-3-3c-2-2-5 0-3 3l8 12c2 4 5 6 9 6h4c6 0 9-4 9-10V22c0-2-1-3-3-3s-3 1-3 3v-3c0-2-1-3-3-3s-3 1-3 3v-3c0-2-1-3-3-3s-3 1-3 3V7c0-2-1-3-3-3z" ' +
  'fill="#000" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/></svg>';

export function svgDataUri(svg: string): string {
  return "data:image/svg+xml," + encodeURIComponent(svg).replace(/"/g, "%22").replace(/'/g, "%27");
}

/** CSS for the "big cursor" effect. Data URIs are built here so encoding is always correct. */
export function cursorCss(): string {
  const arrow = svgDataUri(ARROW_SVG);
  const pointer = svgDataUri(POINTER_SVG);
  const not = ":not([data-nagish-root], [data-nagish-root] *)";
  return (
    `html[data-nagish-cursor], html[data-nagish-cursor] *${not} { cursor: url("${arrow}") 4 3, auto !important; }\n` +
    `html[data-nagish-cursor] :is(a[href], button, [role="button"], [role="link"], summary, label, select, input:is([type="button"], [type="submit"], [type="checkbox"], [type="radio"]))${not} { cursor: url("${pointer}") 18 4, pointer !important; }\n`
  );
}
