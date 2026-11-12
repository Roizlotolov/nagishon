import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_STATE, get, init } from "../../src/index";

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = "";
});
afterEach(() => {
  get()?.destroy();
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("public API", () => {
  it("init is idempotent and warns", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const a = init();
    const b = init();
    expect(b).toBe(a);
    expect(get()).toBe(a);
    expect(warn).toHaveBeenCalled();
  });

  it("set/setState/reset, events and onChange", () => {
    const onChange = vi.fn();
    const evt = vi.fn();
    window.addEventListener("nagishon:change", evt);
    const cb = vi.fn();
    const n = init({ onChange });
    const off = n.on("change", cb);
    n.set("grayscale", true);
    n.setState({ contrast: "light", textScale: 1.25 });
    expect(n.getState()).toMatchObject({ grayscale: true, contrast: "light", textScale: 1.25 });
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(evt).toHaveBeenCalledTimes(2);
    expect((evt.mock.calls[0][0] as CustomEvent).detail.grayscale).toBe(true);
    off();
    n.reset();
    expect(cb).toHaveBeenCalledTimes(2);
    expect(n.getState()).toEqual(DEFAULT_STATE);
    window.removeEventListener("nagishon:change", evt);
  });

  it("dispatches nagishon:ready and open/close events", () => {
    const ready = vi.fn();
    window.addEventListener("nagishon:ready", ready);
    const n = init();
    expect(ready).toHaveBeenCalledTimes(1);
    window.removeEventListener("nagishon:ready", ready);
    const o = vi.fn();
    const c = vi.fn();
    n.on("open", o);
    n.on("close", c);
    n.toggle();
    n.toggle();
    expect(o).toHaveBeenCalledTimes(1);
    expect(c).toHaveBeenCalledTimes(1);
  });

  it("initialState applies only when nothing is stored; storageKey is honored", () => {
    const a = init({ initialState: { grayscale: true }, storageKey: "k1" });
    expect(a.getState().grayscale).toBe(true);
    a.set("stopMotion", true);
    a.destroy();
    expect(localStorage.getItem("k1")).not.toBeNull();
    const b = init({ initialState: { bigCursor: true }, storageKey: "k1" });
    expect(b.getState().bigCursor).toBe(false);
    expect(b.getState().stopMotion).toBe(true);
  });

  it("destroy leaves storage intact and allows re-init", () => {
    const a = init();
    a.set("bigCursor", true);
    a.destroy();
    expect(localStorage.getItem("nagishon:v1")).not.toBeNull();
    expect(init()).not.toBe(a);
  });

  it("exposes resolved options", () => {
    const n = init({ locale: "xx" });
    expect(n.options).toMatchObject({ locale: "he", dir: "rtl", position: "start" });
  });

  it("defers mounting to DOMContentLoaded when body is missing", () => {
    const body = document.body;
    body.remove();
    const n = init();
    expect(document.querySelector("nagishon-widget")).toBeNull();
    document.documentElement.appendChild(body);
    document.dispatchEvent(new Event("DOMContentLoaded"));
    expect(document.querySelector("nagishon-widget")).not.toBeNull();
    n.destroy();
  });
});
