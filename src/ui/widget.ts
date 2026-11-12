import { TEXT_SCALES, type NagishState } from "../core/state";
import { formatHotkey } from "../hotkey";
import { t, type StringKey } from "../i18n";
import type { NagishOptions } from "../index";
import css from "./widget.css";

export interface WidgetConfig {
  options: NagishOptions;
  locale: string;
  dir: "rtl" | "ltr";
  position: "start" | "end";
  state: NagishState;
  onSet(patch: Partial<NagishState>): void;
  onReset(): void;
  onOpen(): void;
  onClose(): void;
}

export interface Widget {
  host: HTMLElement;
  open(): void;
  close(): void;
  isOpen(): boolean;
  update(state: NagishState): void;
  destroy(): void;
}

type Kid = Node | string;
function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Record<string, string | boolean | undefined> = {},
  ...kids: Kid[]
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const k in props) {
    const v = props[k];
    if (v !== undefined && v !== false) e.setAttribute(k, v === true ? "" : v);
  }
  e.append(...kids);
  return e;
}

const TOGGLES: [keyof NagishState, StringKey][] = [
  ["grayscale", "grayscale"],
  ["underlineLinks", "underlineLinks"],
  ["highlightHeadings", "highlightHeadings"],
  ["readableFont", "readableFont"],
  ["textSpacing", "textSpacing"],
  ["stopMotion", "stopMotion"],
  ["bigCursor", "bigCursor"],
  ["readingGuide", "readingGuide"],
];
const CONTRASTS: [string, StringKey][] = [
  ["none", "contrastNone"],
  ["dark", "contrastDark"],
  ["light", "contrastLight"],
];

const ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="4.5" r="2.5"/><path d="M5 8.5h14v2.2h-5.2v3.6l2.4 6.2-2.1.8L12 15.9l-2.1 5.4-2.1-.8 2.4-6.2v-3.6H5z"/></svg>';

/** Picks a readable text color for an arbitrary hex accent. */
function onColor(hex: string): string | undefined {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return undefined;
  const s = m[1].length === 3 ? m[1].replace(/./g, "$&$&") : m[1];
  const c = [0, 2, 4].map((i) => {
    const v = parseInt(s.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] > 0.179 ? "#111" : "#fff";
}

export function createWidget(cfg: WidgetConfig): Widget {
  const { options, locale } = cfg;
  const tr = (k: StringKey, v?: Record<string, string | number>) => t(locale, k, v);
  const features = options.features || {};
  const on = (k: keyof NagishState) => features[k] !== false;
  const coarse = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
  let state = cfg.state;
  let isOpen = false;
  let invoker: HTMLElement | null = null;
  let announceFlip = false;
  let lockedOverflow: string | null = null;
  const inerted: [HTMLElement, "inert" | "aria-hidden", string | null][] = [];
  const sync: (() => void)[] = [];

  const host = h("nagish-widget" as "div", { "data-nagish-root": true, lang: locale, dir: cfg.dir, "data-pos": cfg.position });
  const root = host.attachShadow({ mode: "open" });
  const hs = host.style;
  const th = options.theme || {};
  const off = options.offset || {};
  hs.setProperty("--ob", (off.block ?? 20) + "px");
  hs.setProperty("--oi", (off.inline ?? 20) + "px");
  if (th.accent) {
    hs.setProperty("--nagish-u-accent", th.accent);
    const oc = onColor(th.accent);
    if (oc) hs.setProperty("--nagish-u-on", oc);
  }
  if (th.background) hs.setProperty("--nagish-u-bg", th.background);
  if (th.foreground) hs.setProperty("--nagish-u-fg", th.foreground);
  if (th.radius) hs.setProperty("--nagish-u-radius", th.radius);
  if (th.zIndex !== undefined) hs.setProperty("--nagish-z", String(th.zIndex));

  const live = h("div", { "aria-live": "polite", class: "sr" });
  const announce = (msg: string) => {
    announceFlip = !announceFlip;
    live.textContent = msg + (announceFlip ? "​" : "");
  };

  // Launcher
  const lo = options.launcher || {};
  const showText = lo.showText !== false;
  const label = lo.label || tr("launcher");
  const iconEl = h("span", { "aria-hidden": "true", style: "display:inline-flex" });
  iconEl.innerHTML = ICON;
  const launcher = lo.hidden
    ? null
    : h(
        "button",
        {
          type: "button",
          class: showText ? "launcher" : "launcher icon",
          "data-action": "open",
          "aria-haspopup": "dialog",
          "aria-expanded": "false",
          "aria-controls": "nagish-dialog",
          "aria-label": showText ? undefined : label,
        },
        iconEl,
        showText ? h("span", {}, label) : "",
      );

  // Dialog
  const title = h("h2", { id: "nagish-title", tabindex: "-1" }, tr("title"));
  const closeBtn = h("button", { type: "button", "data-action": "close", "aria-label": tr("close") }, "✕");
  const panel = h(
    "div",
    { role: "dialog", "aria-modal": "true", "aria-labelledby": "nagish-title", id: "nagish-dialog", class: "panel", hidden: true },
    h("div", { class: "head" }, title, closeBtn),
  );
  const backdrop = h("div", { class: "backdrop", hidden: true });

  const pct = (s: number) => Math.round(s * 100) + "%";
  const pressable = (
    key: string,
    value: string,
    text: string,
    isOn: () => boolean,
    patch: Partial<NagishState>,
    msg: () => string,
  ) => {
    const b = h("button", { type: "button", "data-key": key, "data-value": value, "aria-pressed": "false", dir: "ltr" }, text);
    if (key === "contrast") b.removeAttribute("dir");
    b.addEventListener("click", () => {
      cfg.onSet(patch);
      announce(msg());
    });
    sync.push(() => b.setAttribute("aria-pressed", String(isOn())));
    return b;
  };

  if (on("textScale")) {
    const setScale = (i: number) => {
      const s = TEXT_SCALES[i];
      if (s === undefined) return;
      cfg.onSet({ textScale: s });
      announce(tr("announceTextSize", { value: pct(s) }));
    };
    const step = (action: "increase" | "decrease", glyph: string, d: number) => {
      const b = h("button", { type: "button", class: "step", "data-action": action, "aria-label": tr(action) }, glyph);
      b.addEventListener("click", () => setScale(TEXT_SCALES.indexOf(state.textScale) + d));
      sync.push(() => b.setAttribute("aria-disabled", String(TEXT_SCALES[TEXT_SCALES.indexOf(state.textScale) + d] === undefined)));
      return b;
    };
    panel.append(
      h(
        "fieldset",
        {},
        h("legend", {}, tr("textSize")),
        h(
          "div",
          { class: "row sizes", role: "group", "aria-label": tr("textSize") },
          step("decrease", "−", -1),
          ...TEXT_SCALES.map((s) =>
            pressable("textScale", String(s), pct(s), () => state.textScale === s, { textScale: s }, () =>
              tr("announceTextSize", { value: pct(s) }),
            ),
          ),
          step("increase", "+", 1),
        ),
      ),
    );
  }

  if (on("contrast")) {
    panel.append(
      h(
        "fieldset",
        {},
        h("legend", {}, tr("contrast")),
        h(
          "div",
          { class: "row", role: "group", "aria-label": tr("contrast") },
          ...CONTRASTS.map(([v, k]) =>
            pressable("contrast", v, tr(k), () => state.contrast === v, { contrast: v as NagishState["contrast"] }, () =>
              tr("contrast") + ": " + tr(k),
            ),
          ),
        ),
      ),
    );
  }

  const list = h("div", { class: "list" });
  for (const [key, sk] of TOGGLES) {
    if (!on(key) || (key === "readingGuide" && coarse)) continue;
    const sw = h(
      "button",
      { type: "button", role: "switch", "aria-checked": "false", "data-key": key, class: "sw" },
      h("span", {}, tr(sk)),
      h("span", { class: "track", "aria-hidden": "true" }, h("span", { class: "thumb" }, "✓")),
    );
    sw.addEventListener("click", () => {
      const next = !state[key];
      cfg.onSet({ [key]: next });
      announce(tr(next ? "announceOn" : "announceOff", { feature: tr(sk) }));
    });
    sync.push(() => sw.setAttribute("aria-checked", String(!!state[key])));
    list.append(sw);
  }
  if (list.childElementCount) panel.append(list);

  const foot = h("div", { class: "foot" });
  const reset = h("button", { type: "button", class: "reset", "data-action": "reset" }, tr("reset"));
  reset.addEventListener("click", () => {
    cfg.onReset();
    announce(tr("resetDone"));
  });
  foot.append(reset);
  if (options.statementUrl) foot.append(h("a", { href: options.statementUrl }, tr("statement")));
  if (options.contactUrl) foot.append(h("a", { href: options.contactUrl }, tr("contact")));
  if (options.hotkey !== false) {
    const parts = tr("hotkeyHint", { hotkey: "\u0000" }).split("\u0000");
    foot.append(h("p", { class: "hint" }, parts[0], h("bdi", { dir: "ltr" }, formatHotkey(options.hotkey || "Alt+Shift+A")), parts[1] || ""));
  }
  foot.append(h("a", { class: "credit", href: "https://github.com/zloto-labs/nagish", rel: "noopener", target: "_blank" }, tr("poweredBy")));
  panel.append(foot);

  root.append(h("style", {}, css), backdrop, panel, live);
  if (launcher) root.append(launcher);

  // Behaviour
  const focusables = () =>
    Array.from(panel.querySelectorAll<HTMLElement>("button, a[href]")).filter((el) => !el.closest("[hidden]"));
  panel.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const items = focusables();
    const first = items[0];
    const last = items[items.length - 1];
    const active = root.activeElement;
    if (e.shiftKey && (active === first || active === title || !active)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  });
  const onDocKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  };
  const onFocusIn = (e: FocusEvent) => {
    if (e.target !== host) title.focus();
  };
  backdrop.addEventListener("click", () => close());
  closeBtn.addEventListener("click", () => close());
  launcher?.addEventListener("click", () => (isOpen ? close() : open()));

  function lock() {
    const canInert = "inert" in HTMLElement.prototype;
    for (const el of Array.from(document.body.children) as HTMLElement[]) {
      if (el === host) continue;
      if (canInert) {
        if (!el.inert) {
          el.inert = true;
          inerted.push([el, "inert", null]);
        }
      } else {
        inerted.push([el, "aria-hidden", el.getAttribute("aria-hidden")]);
        el.setAttribute("aria-hidden", "true");
      }
    }
    if (window.matchMedia && window.matchMedia("(max-width: 479.98px)").matches) {
      lockedOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
  }
  function unlock() {
    for (const [el, kind, prev] of inerted.splice(0)) {
      if (kind === "inert") el.inert = false;
      else if (prev === null) el.removeAttribute("aria-hidden");
      else el.setAttribute("aria-hidden", prev);
    }
    if (lockedOverflow !== null) {
      document.body.style.overflow = lockedOverflow;
      lockedOverflow = null;
    }
  }

  function open() {
    if (isOpen) return;
    isOpen = true;
    const a = document.activeElement as HTMLElement | null;
    invoker = a && a !== host && a !== document.body ? a : launcher;
    panel.hidden = backdrop.hidden = false;
    host.setAttribute("data-open", "");
    launcher?.setAttribute("aria-expanded", "true");
    lock();
    title.focus();
    document.addEventListener("keydown", onDocKey);
    document.addEventListener("focusin", onFocusIn);
    cfg.onOpen();
  }
  function release() {
    isOpen = false;
    panel.hidden = backdrop.hidden = true;
    host.removeAttribute("data-open");
    launcher?.setAttribute("aria-expanded", "false");
    document.removeEventListener("keydown", onDocKey);
    document.removeEventListener("focusin", onFocusIn);
    unlock();
  }
  function close() {
    if (!isOpen) return;
    release();
    const target = invoker && invoker.isConnected ? invoker : launcher;
    invoker = null;
    target?.focus();
    cfg.onClose();
  }
  function update(s: NagishState) {
    state = s;
    host.setAttribute("data-contrast", s.contrast);
    sync.forEach((f) => f());
  }
  update(state);
  document.body.append(host);

  return {
    host,
    open,
    close,
    isOpen: () => isOpen,
    update,
    destroy() {
      if (isOpen) release();
      host.remove();
    },
  };
}
