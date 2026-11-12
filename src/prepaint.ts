import { applyAttrs } from "./core/attrs";
import { DEFAULT_STORAGE_KEY, normalizeState } from "./core/state";

/**
 * Returns an IIFE source string that reads the stored state and applies the data-nagishon-*
 * attributes synchronously, before first paint. Built from the very functions used at runtime.
 */
export function prepaintScript(storageKey: string = DEFAULT_STORAGE_KEY): string {
  return (
    "(function(){try{var n=" +
    normalizeState.toString() +
    ",a=" +
    applyAttrs.toString() +
    ",r=localStorage.getItem(" +
    JSON.stringify(storageKey).replace(/</g, "\\u003c") +
    ");if(r)a(n(JSON.parse(r)))}catch(e){}})();"
  );
}

export const NAGISHON_PREPAINT: string = prepaintScript();
