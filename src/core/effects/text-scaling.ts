import type { TextScale } from "../state";
import { runChunked } from "./walk";

export type TextScalingStrategy = "elements" | "root";

interface Original {
  fontSize: number; // computed px
  lineHeight: number | null; // computed px, only when it was a px value
  inlineFont: string;
  inlineFontPriority: string;
  inlineLine: string;
  inlineLinePriority: string;
}

const MARK = "data-nagish-scaled";
const CHUNK = 500;
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "HEAD", "META", "LINK", "BR", "WBR"]);
const FORM_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT", "BUTTON"]);

const originals = new WeakMap<Element, Original>();
let scale: TextScale = 1;
let strategy: TextScalingStrategy = "elements";
let gen = 0;
let observer: MutationObserver | null = null;
let pending: Element[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let chunkSize = CHUNK;

// root strategy bookkeeping
let rootOriginal: { px: number; inline: string; priority: string } | null = null;

export function setTextScalingChunkSize(n: number): void {
  chunkSize = n;
}

function hasDirectText(el: Element): boolean {
  for (let n = el.firstChild; n; n = n.nextSibling) {
    if (n.nodeType === 3 && (n.nodeValue ?? "").trim() !== "") return true;
  }
  return false;
}

function isCandidate(el: Element): boolean {
  if (SKIP_TAGS.has(el.tagName)) return false;
  if (el.closest("[data-nagish-root], svg")) return false;
  return FORM_TAGS.has(el.tagName) || hasDirectText(el);
}

function px(v: string): number | null {
  if (!v || !v.endsWith("px")) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function capture(el: HTMLElement): Original | null {
  const known = originals.get(el);
  if (known) return known;
  const cs = getComputedStyle(el);
  const fontSize = px(cs.fontSize);
  if (fontSize === null) return null;
  // Element that merely inherits an already scaled parent: leave it to inheritance.
  const parent = el.parentElement;
  if (parent && parent.hasAttribute(MARK) && el.style.getPropertyValue("font-size") === "") {
    if (px(getComputedStyle(parent).fontSize) === fontSize) return null;
  }
  const o: Original = {
    fontSize,
    lineHeight: px(cs.lineHeight),
    inlineFont: el.style.getPropertyValue("font-size"),
    inlineFontPriority: el.style.getPropertyPriority("font-size"),
    inlineLine: el.style.getPropertyValue("line-height"),
    inlineLinePriority: el.style.getPropertyPriority("line-height"),
  };
  originals.set(el, o);
  return o;
}

function write(el: HTMLElement, o: Original): void {
  el.style.setProperty("font-size", `${round(o.fontSize * scale)}px`, "important");
  if (o.lineHeight !== null) el.style.setProperty("line-height", `${round(o.lineHeight * scale)}px`, "important");
  el.setAttribute(MARK, "");
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function restoreEl(el: HTMLElement): void {
  const o = originals.get(el);
  if (o) {
    if (o.inlineFont === "") el.style.removeProperty("font-size");
    else el.style.setProperty("font-size", o.inlineFont, o.inlineFontPriority);
    if (o.inlineLine === "") el.style.removeProperty("line-height");
    else el.style.setProperty("line-height", o.inlineLine, o.inlineLinePriority);
    originals.delete(el);
  }
  el.removeAttribute(MARK);
  if (el.getAttribute("style") === "") el.removeAttribute("style");
}

function restoreAll(): void {
  document.querySelectorAll<HTMLElement>(`[${MARK}]`).forEach(restoreEl);
}

function collect(root: Element): Element[] {
  const list: Element[] = [root, ...Array.from(root.querySelectorAll("*"))];
  return list.filter(isCandidate);
}

/** Two passes: read every original first (no writes, so inherited sizes stay untouched), then write in chunks. */
function scaleElements(roots: Element[]): void {
  const my = ++gen;
  const targets: HTMLElement[] = [];
  const seen = new Set<Element>();
  for (const r of roots) for (const el of collect(r)) {
      if (seen.has(el)) continue;
      seen.add(el);
      targets.push(el as HTMLElement);
    }
  const cancelled = () => my !== gen;
  const ready: [HTMLElement, Original][] = [];
  runChunked(
    targets,
    (el) => {
      const o = capture(el);
      if (o) ready.push([el, o]);
    },
    chunkSize,
    cancelled,
    () => runChunked(ready, ([el, o]) => write(el, o), chunkSize, cancelled),
  );
}

function flushPending(): void {
  flushTimer = null;
  const roots = pending.filter((n) => n.isConnected);
  pending = [];
  if (scale === 1 || roots.length === 0) return;
  // Do not bump `gen` for incremental work that could cancel a full pass: run them independently.
  const targets: HTMLElement[] = [];
  const seen = new Set<Element>();
  for (const r of roots) for (const el of collect(r)) {
      if (seen.has(el)) continue;
      seen.add(el);
      targets.push(el as HTMLElement);
    }
  const my = gen;
  const ready: [HTMLElement, Original][] = [];
  runChunked(
    targets,
    (el) => {
      const o = capture(el);
      if (o) ready.push([el, o]);
    },
    chunkSize,
    () => my !== gen || scale === 1,
    () => runChunked(ready, ([el, o]) => write(el, o), chunkSize, () => my !== gen || scale === 1),
  );
}

function startObserver(): void {
  if (observer) return;
  observer = new MutationObserver((records) => {
    for (const r of records) {
      r.addedNodes.forEach((n) => {
        if (n instanceof Element && !n.closest("[data-nagish-root]")) pending.push(n);
      });
    }
    if (pending.length && flushTimer === null) flushTimer = setTimeout(flushPending, 0);
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function stopObserver(): void {
  observer?.disconnect();
  observer = null;
  pending = [];
  if (flushTimer !== null) clearTimeout(flushTimer);
  flushTimer = null;
}

function applyRoot(): void {
  const html = document.documentElement;
  if (scale === 1) {
    if (rootOriginal) {
      if (rootOriginal.inline === "") html.style.removeProperty("font-size");
      else html.style.setProperty("font-size", rootOriginal.inline, rootOriginal.priority);
      if (html.getAttribute("style") === "") html.removeAttribute("style");
      rootOriginal = null;
    }
    return;
  }
  if (!rootOriginal) {
    const size = px(getComputedStyle(html).fontSize) ?? 16;
    rootOriginal = {
      px: size,
      inline: html.style.getPropertyValue("font-size"),
      priority: html.style.getPropertyPriority("font-size"),
    };
  }
  html.style.setProperty("font-size", `${round(rootOriginal.px * scale)}px`, "important");
}

/** Sets the text scale using the chosen strategy. Switching strategy restores the previous one first. */
export function setTextScale(next: TextScale, how: TextScalingStrategy = "elements"): void {
  if (how !== strategy) {
    resetStrategy(strategy);
    strategy = how;
  }
  scale = next;
  if (how === "root") {
    applyRoot();
    return;
  }
  if (next === 1) {
    gen++; // cancel running passes
    stopObserver();
    restoreAll();
    return;
  }
  startObserver();
  const roots: Element[] = [document.body];
  scaleElements(roots);
}

function resetStrategy(which: TextScalingStrategy): void {
  const keep = scale;
  scale = 1;
  if (which === "root") applyRoot();
  else {
    gen++;
    stopObserver();
    restoreAll();
  }
  scale = keep;
}

export function teardownTextScaling(): void {
  resetStrategy(strategy);
  scale = 1;
  rootOriginal = null;
}
