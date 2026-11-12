// Standalone, synchronous pre-paint script (built to dist/prepaint.js).
// Uses the same functions as the runtime. No eval, so it works under strict CSP with a nonce/hash/src.
import { applyAttrs } from "./core/attrs";
import { DEFAULT_STORAGE_KEY, normalizeState } from "./core/state";

try {
  const script = document.currentScript;
  const key = (script && script.getAttribute("data-storage-key")) || DEFAULT_STORAGE_KEY;
  const raw = localStorage.getItem(key);
  if (raw) applyAttrs(normalizeState(JSON.parse(raw)));
} catch {
  /* never block rendering */
}
