import { describe, expect, it } from "vitest";
import { LOCALES, getStrings, localeDir, resolveLocale, t } from "../../src/i18n";
import { he } from "../../src/i18n/he";

describe("i18n", () => {
  const heKeys = Object.keys(he).sort();

  it.each(Object.keys(LOCALES))("%s has exactly the Hebrew keys and no empty strings", (loc) => {
    const strings = LOCALES[loc as keyof typeof LOCALES];
    expect(Object.keys(strings).sort()).toEqual(heKeys);
    for (const [k, v] of Object.entries(strings)) expect(v.trim(), `${loc}.${k}`).not.toBe("");
  });

  it.each(Object.keys(LOCALES))("%s keeps the same placeholders as Hebrew", (loc) => {
    const strings = LOCALES[loc as keyof typeof LOCALES] as Record<string, string>;
    for (const [k, v] of Object.entries(he)) {
      const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(",");
      expect(ph(strings[k]), `${loc}.${k}`).toBe(ph(v));
    }
  });

  it("contains the required spec keys", () => {
    for (const k of ["launcher", "title", "hotkeyHint", "skipToContent", "announceOn", "poweredBy"]) {
      expect(heKeys).toContain(k);
    }
  });

  it("uses the exact spec Hebrew copy", () => {
    expect(he.title).toBe("התאמות נגישות");
    expect(he.close).toBe("סגירת התפריט");
    expect(he.skipToContent).toBe("דילוג לתוכן המרכזי");
    expect(he.hotkeyHint).toBe("קיצור מקלדת: {hotkey}");
  });

  it("falls back to Hebrew and derives direction", () => {
    expect(resolveLocale("fr")).toBe("he");
    expect(resolveLocale(undefined)).toBe("he");
    expect(getStrings("xx")).toBe(he);
    expect(localeDir("he")).toBe("rtl");
    expect(localeDir("ar")).toBe("rtl");
    expect(localeDir("en")).toBe("ltr");
    expect(localeDir("ru")).toBe("ltr");
  });

  it("substitutes placeholders", () => {
    expect(t("he", "announceTextSize", { value: "125%" })).toBe("גודל הטקסט: 125%");
    expect(t("en", "hotkeyHint", { hotkey: "Alt+Shift+A" })).toBe("Keyboard shortcut: Alt+Shift+A");
  });
});
