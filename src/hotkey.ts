export interface Hotkey {
  alt: boolean;
  ctrl: boolean;
  shift: boolean;
  meta: boolean;
  key: string; // lower-case
}

function isApple(): boolean {
  return typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent || "");
}

/** Parses "Alt+Shift+A". `Mod` = Meta on Apple platforms, Ctrl elsewhere. Returns null when invalid. */
export function parseHotkey(spec: string): Hotkey | null {
  if (typeof spec !== "string" || !spec.trim()) return null;
  const parts = spec.split("+").map((p) => p.trim());
  const key = parts.pop();
  if (!key) {
    // "Alt++" style: a literal "+" key
    if (spec.trim().endsWith("++")) return parseHotkey(spec.trim().slice(0, -1) + "Plus");
    return null;
  }
  const h: Hotkey = { alt: false, ctrl: false, shift: false, meta: false, key: key === "Plus" ? "+" : key.toLowerCase() };
  for (const p of parts) {
    switch (p.toLowerCase()) {
      case "alt":
      case "option":
        h.alt = true;
        break;
      case "ctrl":
      case "control":
        h.ctrl = true;
        break;
      case "shift":
        h.shift = true;
        break;
      case "meta":
      case "cmd":
      case "command":
        h.meta = true;
        break;
      case "mod":
        if (isApple()) h.meta = true;
        else h.ctrl = true;
        break;
      default:
        return null;
    }
  }
  return h;
}

/** Returns a matcher for KeyboardEvent, or null when the spec is invalid. Modifiers must match exactly. */
export function createHotkeyMatcher(spec: string): ((e: KeyboardEvent) => boolean) | null {
  const h = parseHotkey(spec);
  if (!h) return null;
  const code = h.key.length === 1 && /[a-z]/.test(h.key) ? "Key" + h.key.toUpperCase() : h.key.length === 1 && /\d/.test(h.key) ? "Digit" + h.key : "";
  return (e) => {
    if (e.altKey !== h.alt || e.ctrlKey !== h.ctrl || e.shiftKey !== h.shift || e.metaKey !== h.meta) return false;
    // With Alt held, e.key can be a composed glyph (macOS), so fall back to the physical code.
    return (e.key || "").toLowerCase() === h.key || (code !== "" && e.code === code);
  };
}

/** Human-readable form, e.g. "Alt+Shift+A". */
export function formatHotkey(spec: string): string {
  const h = parseHotkey(spec);
  if (!h) return spec;
  const parts: string[] = [];
  if (h.ctrl) parts.push("Ctrl");
  if (h.alt) parts.push("Alt");
  if (h.shift) parts.push("Shift");
  if (h.meta) parts.push("Meta");
  parts.push(h.key.length === 1 ? h.key.toUpperCase() : h.key.charAt(0).toUpperCase() + h.key.slice(1));
  return parts.join("+");
}
