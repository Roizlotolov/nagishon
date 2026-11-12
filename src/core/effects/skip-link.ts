import { getStrings, type Locale } from "../../i18n";

let link: HTMLAnchorElement | null = null;
let onClick: ((e: Event) => void) | null = null;

export interface SkipLinkOptions {
  target: string;
  label?: string;
}

export function enableSkipLink(opts: SkipLinkOptions, locale: Locale | string = "he"): void {
  disableSkipLink();
  if (!document.body) return;
  let targetEl: Element | null = null;
  try {
    targetEl = document.querySelector(opts.target);
  } catch {
    /* invalid selector */
  }
  if (!targetEl) return;
  let href = opts.target.startsWith("#") && !/[\s.>[:]/.test(opts.target) ? opts.target : "";
  if (!href) {
    if (!targetEl.id) targetEl.id = "nagishon-skip-target";
    href = "#" + targetEl.id;
  }
  const a = document.createElement("a");
  a.href = href;
  a.className = "nagishon-skip";
  a.setAttribute("data-nagishon-root", "skip");
  a.textContent = opts.label ?? getStrings(locale).skipToContent;
  onClick = (e) => {
    const el = document.querySelector(href);
    if (!el) return;
    e.preventDefault();
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
    (el as HTMLElement).focus();
    el.scrollIntoView?.({ block: "start" });
  };
  a.addEventListener("click", onClick);
  document.body.insertBefore(a, document.body.firstChild);
  link = a;
}

export function disableSkipLink(): void {
  if (link && onClick) link.removeEventListener("click", onClick);
  link?.remove();
  link = null;
  onClick = null;
}
