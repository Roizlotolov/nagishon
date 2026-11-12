import effectsCss from "../../styles/effects.css";
import { cursorCss } from "./cursor";

export const STYLE_ID = "nagish-effects";

let createdByUs = false;

/** Injects <style id="nagish-effects"> once; reuses an existing element with that id. */
export function injectStyles(): HTMLStyleElement {
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = effectsCss + "\n" + cursorCss();
    (document.head || document.documentElement).appendChild(el);
    createdByUs = true;
  }
  return el;
}

export function removeStyles(): void {
  if (!createdByUs) return;
  document.getElementById(STYLE_ID)?.remove();
  createdByUs = false;
}
