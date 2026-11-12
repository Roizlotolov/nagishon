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
