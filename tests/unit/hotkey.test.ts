import { describe, expect, it } from "vitest";
import { createHotkeyMatcher, formatHotkey, parseHotkey } from "../../src/hotkey";

const ev = (init: KeyboardEventInit) => new KeyboardEvent("keydown", init);

describe("hotkey", () => {
  it("parses modifiers case-insensitively", () => {
    expect(parseHotkey("Alt+Shift+A")).toEqual({ alt: true, ctrl: false, shift: true, meta: false, key: "a" });
    expect(parseHotkey("ctrl+SHIFT+k")).toMatchObject({ ctrl: true, shift: true, key: "k" });
    expect(parseHotkey("Meta+/")).toMatchObject({ meta: true, key: "/" });
  });

  it("Mod maps to Ctrl or Meta depending on platform", () => {
    const h = parseHotkey("Mod+K");
    expect(h?.ctrl !== h?.meta).toBe(true);
  });

  it("rejects invalid specs", () => {
    expect(parseHotkey("")).toBeNull();
    expect(parseHotkey("Foo+A")).toBeNull();
    expect(createHotkeyMatcher("Hyper+A")).toBeNull();
  });

  it("matches events, ignores key case, requires exact modifiers", () => {
    const m = createHotkeyMatcher("Alt+Shift+A")!;
    expect(m(ev({ key: "A", altKey: true, shiftKey: true }))).toBe(true);
    expect(m(ev({ key: "a", altKey: true, shiftKey: true }))).toBe(true);
    expect(m(ev({ key: "a", altKey: true }))).toBe(false);
    expect(m(ev({ key: "a", altKey: true, shiftKey: true, ctrlKey: true }))).toBe(false);
    expect(m(ev({ key: "b", altKey: true, shiftKey: true }))).toBe(false);
  });

  it("falls back to event.code when Alt composes a different glyph", () => {
    const m = createHotkeyMatcher("Alt+Shift+A")!;
    expect(m(ev({ key: "Å", code: "KeyA", altKey: true, shiftKey: true }))).toBe(true);
  });

  it("formats for display", () => {
    expect(formatHotkey("alt+shift+a")).toBe("Alt+Shift+A");
  });
});
