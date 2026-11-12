// WCAG 2.x contrast check for the nagishon widget palettes. Exits 1 on any failure.
// Usage: node scripts/check-contrast.mjs [--markdown]
const themes = {
  "Light": { bg: "#ffffff", surf: "#f4f5f8", fg: "#111318", ac: "#0b57d0", on: "#ffffff", mut: "#5f6470", bd: "#d9dbe3", ctl: "#737885" },
  "Dark (prefers-color-scheme or theme.preset dark)": { bg: "#17181c", surf: "#1f2127", fg: "#f1f2f6", ac: "#8ab4f8", on: "#17181c", mut: "#b7bbc7", bd: "#353842", ctl: "#8a8f9e" },
  "High contrast (page contrast dark)": { bg: "#000000", surf: "#000000", fg: "#ffffff", ac: "#ffeb3b", on: "#000000", mut: "#ffffff", bd: "#ffffff", ctl: "#ffffff" },
};
/** sRGB mix of two hex colours (pct of a), like CSS color-mix(in srgb). */
function mix(a, b, pct) {
  const n = (h) => [16, 8, 0].map((s) => (parseInt(h.slice(1), 16) >> s) & 255);
  const [x, y] = [n(a), n(b)];
  return "#" + x.map((v, i) => Math.round(v * pct + y[i] * (1 - pct)).toString(16).padStart(2, "0")).join("");
}
for (const t of Object.values(themes)) {
  t.badge = mix(t.ac, t.bg, 0.14); // header badge tint
  t.hover = mix(t.fg, t.surf, 0.06); // hover tint over the card
}

function lin(v) {
  v /= 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}
function lum(hex) {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
}
function ratio(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

// [description, foreground key, background key, kind]
const pairs = [
  ["Body text on panel", "fg", "bg", "text"],
  ["Body text on card (segments, rows, kbd)", "fg", "surf", "text"],
  ["Body text on hovered row", "fg", "hover", "text"],
  ["Muted text (subtitle, labels, credit) on panel", "mut", "bg", "text"],
  ["Muted text (row icons, hint) on card", "mut", "surf", "text"],
  ["Muted text on hovered row", "mut", "hover", "text"],
  ["Link text on panel", "ac", "bg", "text"],
  ["Launcher / selected segment text on accent", "on", "ac", "text"],
  ["Switch check glyph (accent) on thumb", "ac", "bg", "text"],
  ["Header badge glyph on accent tint", "ac", "badge", "ui"],
  ["Selected segment fill on card", "ac", "surf", "ui"],
  ["Switch track (off) on card", "ctl", "surf", "ui"],
  ["Switch thumb on track (off)", "bg", "ctl", "ui"],
  ["Switch track (on) on card", "ac", "surf", "ui"],
  ["Switch thumb on track (on)", "bg", "ac", "ui"],
  ["Reset button border on panel", "ctl", "bg", "ui"],
  ["Focus ring on panel", "ac", "bg", "ui"],
  ["Focus ring on card", "ac", "surf", "ui"],
  ["Launcher focus ring (fg) on its bg gap", "fg", "bg", "ui"],
  ["Launcher fill (accent) on panel bg", "ac", "bg", "ui"],
];

let failed = false;
const rows = [];
for (const [name, t] of Object.entries(themes)) {
  for (const [desc, f, b, kind] of pairs) {
    const r = ratio(t[f], t[b]);
    const min = kind === "text" ? 4.5 : 3;
    const ok = r >= min;
    if (!ok) failed = true;
    rows.push({ theme: name, desc, fg: t[f], bg: t[b], r, min, ok });
  }
}
const md = process.argv.includes("--markdown");
if (md) {
  let cur = "";
  for (const r of rows) {
    if (r.theme !== cur) {
      cur = r.theme;
      console.log(`\n### ${cur}\n\n| Pair | Foreground | Background | Ratio | Required | Result |\n|---|---|---|---|---|---|`);
    }
    console.log(`| ${r.desc} | \`${r.fg}\` | \`${r.bg}\` | ${r.r.toFixed(2)}:1 | ${r.min}:1 | ${r.ok ? "pass" : "FAIL"} |`);
  }
} else {
  for (const r of rows) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.r.toFixed(2).padStart(5)}:1 (min ${r.min})  ${r.theme} / ${r.desc}  ${r.fg} on ${r.bg}`);
}
if (failed) {
  console.error("\nContrast check failed.");
  process.exit(1);
}
