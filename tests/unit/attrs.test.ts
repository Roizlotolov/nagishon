import { beforeEach, describe, expect, it } from "vitest";
import { applyAttrs, clearAttrs } from "../../src/core/attrs";
import { DEFAULT_STATE } from "../../src/core/state";

const html = document.documentElement;
const BOOL_ATTRS: Record<string, string> = {
  grayscale: "data-nagish-grayscale",
  underlineLinks: "data-nagish-links",
  highlightHeadings: "data-nagish-headings",
  readableFont: "data-nagish-font",
  textSpacing: "data-nagish-spacing",
  stopMotion: "data-nagish-motion",
  bigCursor: "data-nagish-cursor",
  readingGuide: "data-nagish-guide",
};

describe("applyAttrs", () => {
  beforeEach(() => clearAttrs());

  it("sets text and contrast always, booleans absent for defaults", () => {
    applyAttrs({ ...DEFAULT_STATE });
    expect(html.getAttribute("data-nagish-text")).toBe("1");
    expect(html.getAttribute("data-nagish-contrast")).toBe("none");
    for (const a of Object.values(BOOL_ATTRS)) expect(html.hasAttribute(a)).toBe(false);
  });

  it.each(Object.entries(BOOL_ATTRS))("%s -> %s is present with empty value when true, removed when false", (key, attr) => {
    applyAttrs({ ...DEFAULT_STATE, [key]: true });
    expect(html.getAttribute(attr)).toBe("");
    applyAttrs({ ...DEFAULT_STATE, [key]: false });
    expect(html.hasAttribute(attr)).toBe(false);
  });

  it("reflects scale and contrast values", () => {
    applyAttrs({ ...DEFAULT_STATE, textScale: 1.75, contrast: "light" });
    expect(html.getAttribute("data-nagish-text")).toBe("1.75");
    expect(html.getAttribute("data-nagish-contrast")).toBe("light");
  });

  it("clearAttrs removes every data-nagish-* attribute", () => {
    applyAttrs({ ...DEFAULT_STATE, grayscale: true });
    clearAttrs();
    expect(html.getAttributeNames().filter((n) => n.startsWith("data-nagish-"))).toEqual([]);
  });
});
