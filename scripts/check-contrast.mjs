// WCAG 2.x contrast check for the nagish widget palettes. Exits 1 on any failure.
// Usage: node scripts/check-contrast.mjs [--markdown]
const themes = {
  "Light (default)": { bg: "#ffffff", fg: "#111111", ac: "#0b57d0", on: "#ffffff", mut: "#4d4d4d", line: "#767676" },
  "Dark (prefers-color-scheme)": { bg: "#1b1b1f", fg: "#f2f2f2", ac: "#8ab4f8", on: "#1b1b1f", mut: "#c4c4cc", line: "#8f8f99" },
  "High contrast (page contrast dark)": { bg: "#000000", fg: "#ffffff", ac: "#ffeb3b", on: "#000000", mut: "#ffffff", line: "#ffffff" },
};

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
  ["Muted text (hint, credit) on panel", "mut", "bg", "text"],
  ["Link text on panel", "ac", "bg", "text"],
  ["Pressed button / launcher text on accent", "on", "ac", "text"],
  ["Switch check glyph (accent) on thumb", "ac", "on", "text"],
  ["Control border on panel", "line", "bg", "ui"],
  ["Switch track (off) on panel", "line", "bg", "ui"],
  ["Switch thumb on track (off)", "on", "line", "ui"],
  ["Switch track (on) on panel", "ac", "bg", "ui"],
  ["Switch thumb on track (on)", "on", "ac", "ui"],
  ["Focus ring on panel", "ac", "bg", "ui"],
  ["Launcher focus ring (fg) on its bg gap", "fg", "bg", "ui"],
  ["Pressed button fill on panel", "ac", "bg", "ui"],
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
