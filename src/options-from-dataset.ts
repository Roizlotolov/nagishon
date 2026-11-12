import type { NagishonState } from "./core/state";
import type { NagishonOptions } from "./index";

const FEATURE_KEYS: (keyof NagishonState)[] = [
  "textScale",
  "contrast",
  "grayscale",
  "underlineLinks",
  "highlightHeadings",
  "readableFont",
  "textSpacing",
  "stopMotion",
  "bigCursor",
  "readingGuide",
];

/** Parses `data-*` attributes of the <script> element into NagishonOptions. Invalid values are ignored. */
export function optionsFromDataset(ds: DOMStringMap | Record<string, string | undefined>): NagishonOptions {
  const o: NagishonOptions = {};
  if (ds.locale) o.locale = ds.locale;
  if (ds.position === "start" || ds.position === "end") o.position = ds.position;
  if (ds.statementUrl) o.statementUrl = ds.statementUrl;
  if (ds.contactUrl) o.contactUrl = ds.contactUrl;
  if (ds.hotkey !== undefined) {
    const v = ds.hotkey.trim();
    if (v === "false" || v === "off" || v === "none") o.hotkey = false;
    else if (v) o.hotkey = v;
  }
  if (ds.textScaling === "elements" || ds.textScaling === "root") o.textScaling = ds.textScaling;
  if (ds.skipLink) o.skipLink = { target: ds.skipLink };
  const num = (v: string | undefined) => (v !== undefined && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : undefined);
  const ob = num(ds.offsetBlock);
  const oi = num(ds.offsetInline);
  if (ob !== undefined || oi !== undefined) {
    o.offset = {};
    if (ob !== undefined) o.offset.block = ob;
    if (oi !== undefined) o.offset.inline = oi;
  }
  if (ds.launcherShape === "pill" || ds.launcherShape === "circle") o.launcher = { ...o.launcher, shape: ds.launcherShape };
  if (ds.launcherSize === "md" || ds.launcherSize === "lg") o.launcher = { ...o.launcher, size: ds.launcherSize };
  if (ds.launcherLabel) o.launcher = { ...o.launcher, label: ds.launcherLabel };
  if (ds.theme === "auto" || ds.theme === "light" || ds.theme === "dark") o.theme = { ...o.theme, preset: ds.theme };
  if (ds.background) o.theme = { ...o.theme, background: ds.background };
  if (ds.foreground) o.theme = { ...o.theme, foreground: ds.foreground };
  if (ds.radius) o.theme = { ...o.theme, radius: ds.radius };
  if (ds.accent) o.theme = { ...o.theme, accent: ds.accent };
  if (ds.zIndex !== undefined && ds.zIndex.trim() !== "" && Number.isFinite(Number(ds.zIndex))) {
    o.theme = { ...o.theme, zIndex: Number(ds.zIndex) };
  }
  if (ds.features) {
    const wanted = ds.features.split(",").map((s) => s.trim());
    const f: Partial<Record<keyof NagishonState, boolean>> = {};
    for (const k of FEATURE_KEYS) f[k] = wanted.indexOf(k) !== -1;
    o.features = f;
  }
  return o;
}
