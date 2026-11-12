import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { get, init } from "../../src/index";

const host = () => document.querySelector("nagishon-widget") as HTMLElement;
const sr = () => host().shadowRoot as ShadowRoot;
const q = <T extends Element = HTMLElement>(sel: string) => sr().querySelector(sel) as T;
const key = (k: string, opts: KeyboardEventInit = {}, target: EventTarget = document) =>
  target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, composed: true, cancelable: true, ...opts }));

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = `<main><button id="page">page</button></main>`;
});
afterEach(() => {
  get()?.destroy();
  localStorage.clear();
});

describe("widget", () => {
  it("renders a host with shadow root, lang and dir", () => {
    init();
    expect(host().hasAttribute("data-nagishon-root")).toBe(true);
    expect(host().getAttribute("lang")).toBe("he");
    expect(host().getAttribute("dir")).toBe("rtl");
    const l = q('[data-action="open"]');
    expect(l.getAttribute("aria-haspopup")).toBe("dialog");
    expect(l.getAttribute("aria-expanded")).toBe("false");
    expect(q('[role="dialog"]').hasAttribute("hidden")).toBe(true);
  });

  it("opens focusing the title, closes with Escape and returns focus", () => {
    init();
    const l = q<HTMLButtonElement>('[data-action="open"]');
    l.focus();
    l.click();
    expect(l.getAttribute("aria-expanded")).toBe("true");
    expect(sr().activeElement).toBe(q("#nagishon-title"));
    expect(q('[role="dialog"]').hasAttribute("hidden")).toBe(false);
    key("Escape");
    expect(l.getAttribute("aria-expanded")).toBe("false");
    expect(sr().activeElement).toBe(l);
  });

  it("wraps Tab from last to first control and Shift+Tab back", () => {
    init({ statementUrl: "/s" });
    get()!.open();
    const items = Array.from(sr().querySelectorAll<HTMLElement>('[role="dialog"] button, [role="dialog"] a[href]'));
    items[items.length - 1].focus();
    key("Tab", {}, items[items.length - 1]);
    expect(sr().activeElement).toBe(items[0]);
    key("Tab", { shiftKey: true }, items[0]);
    expect(sr().activeElement).toBe(items[items.length - 1]);
  });

  it("makes the page inert while open and restores it", () => {
    init();
    const main = document.querySelector("main") as HTMLElement;
    get()!.open();
    expect(main.inert || main.getAttribute("aria-hidden") === "true").toBe(true);
    get()!.close();
    expect(main.inert).toBeFalsy();
    expect(main.hasAttribute("aria-hidden")).toBe(false);
  });

  it("switches flip aria-checked, update state and storage", () => {
    init();
    const sw = q('[data-key="grayscale"]');
    expect(sw.getAttribute("role")).toBe("switch");
    sw.click();
    expect(sw.getAttribute("aria-checked")).toBe("true");
    expect(get()!.getState().grayscale).toBe(true);
    expect(JSON.parse(localStorage.getItem("nagishon:v1")!).grayscale).toBe(true);
    expect(document.documentElement.hasAttribute("data-nagishon-grayscale")).toBe(true);
    expect(q('[aria-live="polite"]').textContent).toContain("גווני אפור");
  });

  it("text size and contrast buttons use aria-pressed; steps work", () => {
    init();
    q('[data-key="textScale"][data-value="1.5"]').click();
    expect(q('[data-key="textScale"][data-value="1.5"]').getAttribute("aria-pressed")).toBe("true");
    q('[data-action="increase"]').click();
    expect(get()!.getState().textScale).toBe(1.75);
    q('[data-action="decrease"]').click();
    q('[data-action="decrease"]').click();
    expect(get()!.getState().textScale).toBe(1.25);
    q('[data-key="contrast"][data-value="dark"]').click();
    expect(get()!.getState().contrast).toBe("dark");
    expect(host().getAttribute("data-contrast")).toBe("dark");
  });

  it("reset restores defaults and removes the storage key", () => {
    init();
    q('[data-key="bigCursor"]').click();
    expect(localStorage.getItem("nagishon:v1")).not.toBeNull();
    q('[data-action="reset"]').click();
    expect(get()!.getState().bigCursor).toBe(false);
    expect(localStorage.getItem("nagishon:v1")).toBeNull();
    expect(q('[data-key="bigCursor"]').getAttribute("aria-checked")).toBe("false");
  });

  it("features hides controls", () => {
    init({ features: { grayscale: false, textScale: false, contrast: false } });
    expect(sr().querySelector('[data-key="grayscale"]')).toBeNull();
    expect(sr().querySelector('[data-key="textScale"]')).toBeNull();
    expect(sr().querySelector('[data-key="contrast"]')).toBeNull();
    expect(sr().querySelector('[data-key="stopMotion"]')).not.toBeNull();
  });

  it("renders statement and contact links only when configured; credit always", () => {
    init();
    expect(sr().querySelectorAll('[role="dialog"] a').length).toBe(1);
    get()!.destroy();
    init({ statementUrl: "/s", contactUrl: "mailto:a@b.c" });
    expect(sr().querySelectorAll('[role="dialog"] a').length).toBe(3);
    expect(q('a[href^="https://github.com"]').getAttribute("rel")).toBe("noopener");
  });

  it("launcher.hidden: no launcher, focus returns to the invoker", () => {
    init({ launcher: { hidden: true } });
    expect(sr().querySelector('[data-action="open"]')).toBeNull();
    const b = document.getElementById("page")!;
    b.focus();
    get()!.open();
    key("Escape");
    expect(document.activeElement).toBe(b);
  });

  it("en locale flips to ltr", () => {
    init({ locale: "en" });
    expect(host().getAttribute("dir")).toBe("ltr");
    expect(q("#nagishon-title").textContent).toBe("Accessibility settings");
  });

  it("destroy removes host and data-nagishon-* attributes", () => {
    init();
    q('[data-key="grayscale"]').click();
    get()!.destroy();
    expect(document.querySelector("nagishon-widget")).toBeNull();
    expect(document.documentElement.getAttributeNames().filter((n) => n.startsWith("data-nagishon-"))).toEqual([]);
    expect(get()).toBeNull();
  });

  it("hotkey opens and closes", () => {
    init();
    key("A", { altKey: true, shiftKey: true });
    expect(q('[role="dialog"]').hasAttribute("hidden")).toBe(false);
    key("A", { altKey: true, shiftKey: true });
    expect(q('[role="dialog"]').hasAttribute("hidden")).toBe(true);
  });
});
