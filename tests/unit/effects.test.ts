import { afterEach, describe, expect, it } from "vitest";
import { applyEffects, teardownEffects } from "../../src/core/effects";
import { STYLE_ID } from "../../src/core/effects/inject-styles";
import { DEFAULT_STATE } from "../../src/core/state";

afterEach(() => {
  teardownEffects();
  document.body.innerHTML = "";
});

describe("applyEffects / teardownEffects", () => {
  it("injects the stylesheet once and reuses an existing element", () => {
    applyEffects({ ...DEFAULT_STATE }, null);
    applyEffects({ ...DEFAULT_STATE, grayscale: true }, { ...DEFAULT_STATE });
    expect(document.querySelectorAll(`#${STYLE_ID}`).length).toBe(1);
    expect(document.getElementById(STYLE_ID)!.textContent).toContain("data-nagishon-contrast");
    expect(document.getElementById(STYLE_ID)!.textContent).toContain("data:image/svg+xml,");
    expect(document.documentElement.hasAttribute("data-nagishon-grayscale")).toBe(true);
  });

  it("marks icon fonts when readable font is on", () => {
    document.body.innerHTML = `<i id="i" style="font-family: 'Font Awesome 6 Free'"></i><p id="p" style="font-family: serif">x</p>`;
    applyEffects({ ...DEFAULT_STATE, readableFont: true }, null);
    expect(document.getElementById("i")!.hasAttribute("data-nagishon-keep-font")).toBe(true);
    expect(document.getElementById("p")!.hasAttribute("data-nagishon-keep-font")).toBe(false);
    applyEffects({ ...DEFAULT_STATE }, { ...DEFAULT_STATE, readableFont: true });
    expect(document.getElementById("i")!.hasAttribute("data-nagishon-keep-font")).toBe(false);
  });

  it("flags autoplay media as paused and resumes on disable", () => {
    document.body.innerHTML = `<video id="v" autoplay muted loop></video>`;
    const v = document.getElementById("v") as HTMLVideoElement;
    v.pause = () => undefined;
    v.play = () => Promise.resolve();
    applyEffects({ ...DEFAULT_STATE, stopMotion: true }, null);
    expect(v.hasAttribute("data-nagishon-paused")).toBe(true);
    expect(v.hasAttribute("autoplay")).toBe(false);
    applyEffects({ ...DEFAULT_STATE }, { ...DEFAULT_STATE, stopMotion: true });
    expect(v.hasAttribute("data-nagishon-paused")).toBe(false);
  });

  it("teardown removes attributes, style and helper nodes", () => {
    document.body.innerHTML = `<main id="main"></main>`;
    applyEffects({ ...DEFAULT_STATE, contrast: "dark", underlineLinks: true }, null, { skipLink: { target: "#main" } });
    expect(document.querySelector(".nagishon-skip")).not.toBeNull();
    teardownEffects();
    expect(document.getElementById(STYLE_ID)).toBeNull();
    expect(document.querySelector(".nagishon-skip")).toBeNull();
    expect(document.documentElement.getAttributeNames().some((n) => n.startsWith("data-nagishon-"))).toBe(false);
  });
});
