import { TEXT_SCALES, type NagishonState } from "../core/state";
import { formatHotkey } from "../hotkey";
import { t, type StringKey } from "../i18n";
import type { NagishonOptions } from "../index";
import css from "./widget.css";

export interface WidgetConfig {
  options: NagishonOptions;
  locale: string;
  dir: "rtl" | "ltr";
  position: "start" | "end";
  state: NagishonState;
  onSet(patch: Partial<NagishonState>): void;
  onReset(): void;
  onOpen(): void;
  onClose(): void;
}

export interface Widget {
  host: HTMLElement;
  open(): void;
  close(): void;
  isOpen(): boolean;
  update(state: NagishonState): void;
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

const TOGGLES: [keyof NagishonState, StringKey][] = [
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

const svg = (d: string, cls = "") =>
  '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"' + (cls ? ' class="' + cls + '"' : "") + '><path d="' + d + '"/></svg>';
/** Filled person glyph (launcher and header badge). */
const PERSON = svg("M12 2a2.6 2.6 0 1 1 0 5.2A2.6 2.6 0 0 1 12 2zM5 8.5h14v2.2h-5.2v3.6l2.4 6.2-2.1.8L12 15.9l-2.1 5.4-2.1-.8 2.4-6.2v-3.6H5z", "fill");
/** 24-box line icons, one path each. */
const ICONS: Record<string, string> = {
  grayscale: "M12 3v18M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",
  underlineLinks: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  highlightHeadings: "M6 4v16M18 4v16M6 12h12",
  readableFont: "M2.5 19 7.5 5l5 14M4.6 14h5.8M21 19v-7M21 15a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  textSpacing: "M4 4v16M20 4v16M8 12h8M8 12l2.5-2.5M8 12l2.5 2.5M16 12l-2.5-2.5M16 12l-2.5 2.5",
  stopMotion: "M8 5h2.5v14H8zM13.5 5H16v14h-2.5z",
  bigCursor: "M5 3l14 7-6 2-2 6z",
  readingGuide: "M3 8h18v8H3zM7 8v3M11 8v2M15 8v3M19 8v2",
  undo: "M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3",
  close: "M6 6l12 12M18 6 6 18",
  darkGlyph: "M12 4a8 8 0 0 0 0 16zM12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16z",
  lightGlyph: "M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16z",
};
const ico = (k: string): HTMLElement => {
  const e = h("span", { class: "ico", "aria-hidden": "true" });
  e.innerHTML = svg(ICONS[k], k === "darkGlyph" ? "half" : "");
  return e;
};

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
  const on = (k: keyof NagishonState) => features[k] !== false;
  const coarse = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
  let state = cfg.state;
  let isOpen = false;
  let invoker: HTMLElement | null = null;
  let announceFlip = false;
  let lockedOverflow: string | null = null;
  const inerted: [HTMLElement, "inert" | "aria-hidden", string | null][] = [];
  const sync: (() => void)[] = [];

  const host = h("nagishon-widget" as "div", { "data-nagishon-root": true, lang: locale, dir: cfg.dir, "data-pos": cfg.position });
  const root = host.attachShadow({ mode: "open" });
  const hs = host.style;
  const th = options.theme || {};
  const off = options.offset || {};
  if (th.preset === "light" || th.preset === "dark") host.setAttribute("data-theme", th.preset);
  host.setAttribute("data-size", options.launcher?.size === "lg" ? "lg" : "md");
  hs.setProperty("--ob", (off.block ?? 20) + "px");
  hs.setProperty("--oi", (off.inline ?? 20) + "px");
  if (th.accent) {
    hs.setProperty("--nagishon-u-accent", th.accent);
    const oc = onColor(th.accent);
    if (oc) hs.setProperty("--nagishon-u-on", oc);
  }
  if (th.background) {
    hs.setProperty("--nagishon-u-bg", th.background);
    hs.setProperty("--nagishon-u-surf", "color-mix(in srgb,var(--fg) 5%,var(--bg))");
  }
  if (th.foreground) hs.setProperty("--nagishon-u-fg", th.foreground);
  if (th.radius) hs.setProperty("--nagishon-u-radius", th.radius);
  if (th.zIndex !== undefined) hs.setProperty("--nagishon-z", String(th.zIndex));

  const live = h("div", { "aria-live": "polite", class: "sr" });
  const announce = (msg: string) => {
    announceFlip = !announceFlip;
    live.textContent = msg + (announceFlip ? "​" : "");
  };

  // Launcher
  const lo = options.launcher || {};
  const showText = lo.showText !== false && lo.shape !== "circle";
  const label = lo.label || tr("launcher");
  const iconEl = h("span", { "aria-hidden": "true", class: "ico" });
  iconEl.innerHTML = PERSON;
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
          "aria-controls": "nagishon-dialog",
          "aria-label": showText ? undefined : label,
        },
        iconEl,
        showText ? h("span", {}, label) : "",
      );

  // Dialog
  const title = h("h2", { id: "nagishon-title", tabindex: "-1" }, tr("title"));
  const closeBtn = h("button", { type: "button", class: "close", "data-action": "close", "aria-label": tr("close") }, ico("close"));
  const badge = h("span", { class: "badge", "aria-hidden": "true" });
  badge.innerHTML = PERSON;
  const panel = h(
    "div",
    { role: "dialog", "aria-modal": "true", "aria-labelledby": "nagishon-title", id: "nagishon-dialog", class: "panel", hidden: true },
    h("div", { class: "head" }, badge, h("div", { class: "heading" }, title, h("p", { class: "sub" }, tr("subtitle"))), closeBtn),
  );
  const backdrop = h("div", { class: "backdrop", hidden: true });

  const pct = (s: number) => Math.round(s * 100) + "%";
  const pressable = (
    key: string,
    value: string,
    text: Kid[],
    isOn: () => boolean,
    patch: Partial<NagishonState>,
    msg: () => string,
  ) => {
    const b = h("button", { type: "button", "data-key": key, "data-value": value, "aria-pressed": "false", dir: "ltr" }, ...text);
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
          { class: "seg sizes", role: "group", "aria-label": tr("textSize") },
          step("decrease", "−", -1),
          ...TEXT_SCALES.map((s) =>
            pressable("textScale", String(s), [pct(s)], () => state.textScale === s, { textScale: s }, () =>
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
          { class: "seg", role: "group", "aria-label": tr("contrast") },
          ...CONTRASTS.map(([v, k]) =>
            pressable("contrast", v, [v === "none" ? "" : ico(v === "dark" ? "darkGlyph" : "lightGlyph"), h("span", {}, tr(k))], () => state.contrast === v, { contrast: v as NagishonState["contrast"] }, () =>
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
      ico(key),
      h("span", { class: "lbl" }, tr(sk)),
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
  const reset = h("button", { type: "button", class: "reset", "data-action": "reset" }, ico("undo"), h("span", {}, tr("reset")));
  reset.addEventListener("click", () => {
    cfg.onReset();
    announce(tr("resetDone"));
  });
  foot.append(reset);
  const links = h("div", { class: "links" });
  if (options.statementUrl) links.append(h("a", { href: options.statementUrl }, tr("statement")));
  if (options.contactUrl) links.append(h("a", { href: options.contactUrl }, tr("contact")));
  if (links.childElementCount) foot.append(links);
  const meta = h("div", { class: "meta" });
  if (options.hotkey !== false) {
    const parts = tr("hotkeyHint", { hotkey: "\u0000" }).split("\u0000");
    meta.append(h("p", { class: "hint" }, parts[0], h("kbd", { dir: "ltr" }, formatHotkey(options.hotkey || "Alt+Shift+A")), parts[1] || ""));
  }
  meta.append(h("a", { class: "credit", href: "https://github.com/Roizlotolov/nagishon", rel: "noopener", target: "_blank" }, tr("poweredBy")));
  foot.append(meta);
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
  function update(s: NagishonState) {
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
