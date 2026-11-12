import type { Contrast, NagishonState, TextScale } from "./core/state";
import { applyEffects, teardownEffects } from "./core/effects";
import { createStateStore, DEFAULT_STORAGE_KEY } from "./core/state";
import { createHotkeyMatcher } from "./hotkey";
import { localeDir, resolveLocale, type Locale } from "./i18n";
import { createWidget, type Widget } from "./ui/widget";

export interface NagishonOptions {
  locale?: Locale | (string & {});
  dir?: "rtl" | "ltr";
  position?: "start" | "end";
  offset?: { block?: number; inline?: number };
  statementUrl?: string;
  contactUrl?: string;
  hotkey?: string | false;
  textScaling?: "elements" | "root";
  skipLink?: { target: string; label?: string } | false;
  features?: Partial<Record<keyof NagishonState, boolean>>;
  theme?: Partial<{ accent: string; background: string; foreground: string; radius: string; zIndex: number }>;
  launcher?: { label?: string; showText?: boolean; hidden?: boolean };
  initialState?: Partial<NagishonState>;
  storageKey?: string;
  onChange?: (state: NagishonState) => void;
}

export interface NagishonInstance {
  open(): void;
  close(): void;
  toggle(): void;
  getState(): NagishonState;
  set<K extends keyof NagishonState>(key: K, value: NagishonState[K]): void;
  setState(patch: Partial<NagishonState>): void;
  reset(): void;
  on(event: "change" | "open" | "close", cb: (state: NagishonState) => void): () => void;
  destroy(): void;
  readonly options: Readonly<Required<Pick<NagishonOptions, "locale" | "dir" | "position">>> & NagishonOptions;
}

type Ev = "change" | "open" | "close";
let current: NagishonInstance | null = null;

export function init(options: NagishonOptions = {}): NagishonInstance {
  if (current) {
    if (typeof console !== "undefined") console.warn("nagishon: already initialized; returning the existing instance. Call destroy() first to re-init.");
    return current;
  }
  const locale = resolveLocale(options.locale);
  const resolved = {
    ...options,
    locale,
    dir: options.dir || localeDir(locale),
    position: options.position || "start",
  };
  const store = createStateStore(options.storageKey || DEFAULT_STORAGE_KEY, options.initialState);
  const listeners: Record<Ev, Set<(s: NagishonState) => void>> = { change: new Set(), open: new Set(), close: new Set() };
  const fire = (ev: Ev) => listeners[ev].forEach((cb) => cb(store.get()));
  let widget: Widget | null = null;
  let prev: NagishonState | null = null;
  let destroyed = false;
  let pendingOpen = false;

  const apply = () => {
    applyEffects(store.get(), prev, { textScaling: options.textScaling, skipLink: options.skipLink, locale });
    prev = store.get();
  };
  const unsub = store.subscribe((s) => {
    if (widget) {
      apply();
      widget.update(s);
    }
    window.dispatchEvent(new CustomEvent("nagishon:change", { detail: s }));
    options.onChange?.(s);
    fire("change");
  });

  const matcher = options.hotkey === false ? null : createHotkeyMatcher(options.hotkey || "Alt+Shift+A");
  const onKey = (e: KeyboardEvent) => {
    if (matcher && matcher(e)) {
      e.preventDefault();
      instance.toggle();
    }
  };
  document.addEventListener("keydown", onKey);

  const mount = () => {
    if (destroyed) return;
    document.removeEventListener("DOMContentLoaded", mount);
    widget = createWidget({
      options,
      locale,
      dir: resolved.dir,
      position: resolved.position,
      state: store.get(),
      onSet: (p) => {
        store.set(p);
      },
      onReset: () => {
        store.reset();
      },
      onOpen: () => fire("open"),
      onClose: () => fire("close"),
    });
    apply();
    window.dispatchEvent(new CustomEvent("nagishon:ready", { detail: store.get() }));
    if (pendingOpen) widget.open();
  };
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);

  const instance: NagishonInstance = {
    open() {
      if (widget) widget.open();
      else pendingOpen = true;
    },
    close() {
      pendingOpen = false;
      widget?.close();
    },
    toggle() {
      if (widget?.isOpen()) widget.close();
      else instance.open();
    },
    getState: () => store.get(),
    set: (key, value) => {
      store.set({ [key]: value });
    },
    setState: (patch) => {
      store.set(patch);
    },
    reset: () => {
      store.reset();
    },
    on(event, cb) {
      listeners[event].add(cb);
      return () => listeners[event].delete(cb);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      document.removeEventListener("DOMContentLoaded", mount);
      document.removeEventListener("keydown", onKey);
      unsub();
      store.destroy();
      widget?.destroy();
      widget = null;
      teardownEffects();
      listeners.change.clear();
      listeners.open.clear();
      listeners.close.clear();
      if (current === instance) current = null;
    },
    options: resolved,
  };
  current = instance;
  return instance;
}

export function get(): NagishonInstance | null {
  return current;
}

export { DEFAULT_STATE, normalizeState } from "./core/state";
export type { NagishonState, TextScale, Contrast };
