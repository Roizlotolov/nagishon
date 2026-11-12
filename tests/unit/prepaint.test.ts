import { beforeEach, describe, expect, it } from "vitest";
import { clearAttrs } from "../../src/core/attrs";
import { NAGISH_PREPAINT, prepaintScript } from "../../src/prepaint";

const html = document.documentElement;

describe("prepaint", () => {
  beforeEach(() => {
    localStorage.clear();
    clearAttrs();
  });

  it("is self-contained: no import/export/helper references", () => {
    expect(NAGISH_PREPAINT).not.toMatch(/\bimport\b/);
    expect(NAGISH_PREPAINT).not.toMatch(/\bexport\b/);
    expect(NAGISH_PREPAINT).not.toMatch(/__/);
    expect(NAGISH_PREPAINT).not.toMatch(/\bDEFAULT_STATE\b/);
  });

  it("executes via new Function and applies stored attributes", () => {
    localStorage.setItem("nagish:v1", JSON.stringify({ contrast: "dark", textScale: 1.5, grayscale: true }));
    new Function(NAGISH_PREPAINT)();
    expect(html.getAttribute("data-nagish-contrast")).toBe("dark");
    expect(html.getAttribute("data-nagish-text")).toBe("1.5");
    expect(html.getAttribute("data-nagish-grayscale")).toBe("");
    expect(html.hasAttribute("data-nagish-links")).toBe(false);
  });

  it("does nothing without stored state and never throws on garbage", () => {
    new Function(NAGISH_PREPAINT)();
    expect(html.hasAttribute("data-nagish-contrast")).toBe(false);
    localStorage.setItem("nagish:v1", "{{{");
    expect(() => new Function(NAGISH_PREPAINT)()).not.toThrow();
  });

  it("supports a custom storage key and escapes it", () => {
    localStorage.setItem("custom</script>", JSON.stringify({ stopMotion: true }));
    const s = prepaintScript("custom</script>");
    expect(s).not.toContain("</script>");
    new Function(s)();
    expect(html.hasAttribute("data-nagish-motion")).toBe(true);
  });
});
