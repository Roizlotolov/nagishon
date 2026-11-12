import { describe, expect, it } from "vitest";
import { optionsFromDataset } from "../../src/options-from-dataset";

describe("optionsFromDataset", () => {
  it("parses all supported attributes", () => {
    const o = optionsFromDataset({
      nagishon: "",
      locale: "en",
      position: "end",
      statementUrl: "/a",
      contactUrl: "mailto:a@b.c",
      hotkey: "Ctrl+K",
      textScaling: "root",
      skipLink: "#main",
      accent: "#123456",
      zIndex: "99",
      features: "grayscale, textScale",
    });
    expect(o).toMatchObject({
      locale: "en",
      position: "end",
      statementUrl: "/a",
      contactUrl: "mailto:a@b.c",
      hotkey: "Ctrl+K",
      textScaling: "root",
      skipLink: { target: "#main" },
      theme: { accent: "#123456", zIndex: 99 },
    });
    expect(o.features?.grayscale).toBe(true);
    expect(o.features?.textScale).toBe(true);
    expect(o.features?.contrast).toBe(false);
  });
  it("parses launcher position, shape, size, label and theme attributes", () => {
    const o = optionsFromDataset({
      offsetBlock: "32",
      offsetInline: "0",
      launcherShape: "circle",
      launcherSize: "lg",
      launcherLabel: "Help",
      theme: "dark",
      background: "#101010",
      foreground: "#fafafa",
      radius: "8px",
      accent: "#ff6a00",
    });
    expect(o).toEqual({
      offset: { block: 32, inline: 0 },
      launcher: { shape: "circle", size: "lg", label: "Help" },
      theme: { preset: "dark", background: "#101010", foreground: "#fafafa", radius: "8px", accent: "#ff6a00" },
    });
  });
  it("ignores invalid launcher and theme values", () => {
    const o = optionsFromDataset({ offsetBlock: "x", offsetInline: "", launcherShape: "square", launcherSize: "xl", theme: "sepia" });
    expect(o).toEqual({});
  });
  it("ignores invalid values and supports hotkey off", () => {
    const o = optionsFromDataset({ position: "left", textScaling: "x", zIndex: "abc", hotkey: "false" });
    expect(o).toEqual({ hotkey: false });
  });
});
