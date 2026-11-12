"use client";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { DEFAULT_STATE, get, init, type NagishInstance, type NagishOptions, type NagishState } from "../index";

export function NagishWidget(props: NagishOptions): null {
  const ref = useRef(props.onChange);
  ref.current = props.onChange;
  const key = JSON.stringify({ ...props, onChange: undefined });
  useEffect(() => {
    const opts: NagishOptions = { ...JSON.parse(key), onChange: (s) => ref.current?.(s) };
    const instance = init(opts);
    return () => instance.destroy();
  }, [key]);
  return null;
}

let snapshot: NagishState = DEFAULT_STATE;
function subscribe(cb: () => void): () => void {
  const fn = () => cb();
  window.addEventListener("nagish:change", fn);
  window.addEventListener("nagish:ready", fn);
  return () => {
    window.removeEventListener("nagish:change", fn);
    window.removeEventListener("nagish:ready", fn);
  };
}
function getSnapshot(): NagishState {
  const inst = get();
  if (inst) {
    const s = inst.getState();
    if (s !== snapshot) snapshot = s;
  }
  return snapshot;
}

export function useNagish() {
  const state = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_STATE);
  const instance: NagishInstance | null = typeof window === "undefined" ? null : get();
  return {
    state,
    instance,
    set: ((k, v) => get()?.set(k, v)) as NagishInstance["set"],
    setState: (p: Partial<NagishState>) => get()?.setState(p),
    reset: () => get()?.reset(),
    open: () => get()?.open(),
    close: () => get()?.close(),
  };
}

export { NAGISH_PREPAINT } from "../prepaint";
