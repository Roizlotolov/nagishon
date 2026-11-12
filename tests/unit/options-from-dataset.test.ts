import { describe, expect, it } from "vitest";
import { optionsFromDataset } from "../../src/options-from-dataset";

describe("optionsFromDataset", () => {
  it("parses all supported attributes", () => {
    const o = optionsFromDataset({
      nagish: "",
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
  it("ignores invalid values and supports hotkey off", () => {
    const o = optionsFromDataset({ position: "left", textScaling: "x", zIndex: "abc", hotkey: "false" });
    expect(o).toEqual({ hotkey: false });
  });
});
