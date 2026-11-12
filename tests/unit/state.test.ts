import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_STATE,
  createStateStore,
  normalizeState,
  readStoredState,
  writeStoredState,
} from "../../src/core/state";

describe("normalizeState", () => {
  it.each([undefined, null, 0, 1, "x", true, [], [1, 2], () => 1, NaN])("returns defaults for %s", (v) => {
    expect(normalizeState(v)).toEqual(DEFAULT_STATE);
  });

  it("rejects bad field values field by field", () => {
    const s = normalizeState({
      textScale: 3,
      contrast: "purple",
      grayscale: "yes",
      underlineLinks: 1,
      highlightHeadings: null,
      readableFont: "true",
      unknown: "ignored",
    });
    expect(s).toEqual(DEFAULT_STATE);
    expect(s).not.toHaveProperty("unknown");
  });

  it("keeps valid values and coerces numeric-string scales", () => {
    const s = normalizeState({ textScale: "1.5", contrast: "dark", grayscale: true, bigCursor: true });
    expect(s.textScale).toBe(1.5);
    expect(s.contrast).toBe("dark");
    expect(s.grayscale).toBe(true);
    expect(s.bigCursor).toBe(true);
    expect(s.stopMotion).toBe(false);
  });

  it("does not mutate input or share references with DEFAULT_STATE", () => {
    const input = { textScale: 2 };
    const out = normalizeState(input);
    expect(input).toEqual({ textScale: 2 });
    expect(out).not.toBe(DEFAULT_STATE);
  });
});

describe("storage", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("removes the key when state equals default", () => {
    writeStoredState({ ...DEFAULT_STATE, grayscale: true });
    expect(localStorage.getItem("nagish:v1")).not.toBeNull();
    writeStoredState({ ...DEFAULT_STATE });
    expect(localStorage.getItem("nagish:v1")).toBeNull();
  });

  it("reads null when nothing stored and tolerates corrupt JSON", () => {
    expect(readStoredState()).toBeNull();
    localStorage.setItem("nagish:v1", "{not json");
    expect(readStoredState()).toBeNull();
  });

  it("store applies initialState only when nothing is stored", () => {
    const a = createStateStore("nagish:v1", { grayscale: true });
    expect(a.get().grayscale).toBe(true);
    a.destroy();
    localStorage.setItem("nagish:v1", JSON.stringify({ contrast: "light" }));
    const b = createStateStore("nagish:v1", { grayscale: true });
    expect(b.get().grayscale).toBe(false);
    expect(b.get().contrast).toBe("light");
    b.destroy();
  });

  it("set persists, notifies, and reset removes the key", () => {
    const store = createStateStore();
    const seen: boolean[] = [];
    store.subscribe((s) => seen.push(s.stopMotion));
    store.set({ stopMotion: true });
    expect(JSON.parse(localStorage.getItem("nagish:v1") ?? "{}").stopMotion).toBe(true);
    store.set({ stopMotion: true }); // no change, no emit
    store.reset();
    expect(localStorage.getItem("nagish:v1")).toBeNull();
    expect(seen).toEqual([true, false]);
    store.destroy();
  });

  it("syncs across tabs via the storage event", () => {
    const store = createStateStore();
    const seen: string[] = [];
    store.subscribe((s) => seen.push(s.contrast));
    localStorage.setItem("nagish:v1", JSON.stringify({ contrast: "dark" }));
    window.dispatchEvent(new StorageEvent("storage", { key: "nagish:v1", newValue: '{"contrast":"dark"}' }));
    expect(store.get().contrast).toBe("dark");
    localStorage.removeItem("nagish:v1");
    window.dispatchEvent(new StorageEvent("storage", { key: "nagish:v1", newValue: null }));
    expect(store.get().contrast).toBe("none");
    window.dispatchEvent(new StorageEvent("storage", { key: "other", newValue: "x" }));
    expect(seen).toEqual(["dark", "none"]);
    store.destroy();
  });
});
