"use client";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { DEFAULT_STATE, get, init, type NagishonInstance, type NagishonOptions, type NagishonState } from "../index";

export function NagishonWidget(props: NagishonOptions): null {
  const ref = useRef(props.onChange);
  ref.current = props.onChange;
  const key = JSON.stringify({ ...props, onChange: undefined });
  useEffect(() => {
    const opts: NagishonOptions = { ...JSON.parse(key), onChange: (s) => ref.current?.(s) };
    const instance = init(opts);
    return () => instance.destroy();
  }, [key]);
  return null;
}

let snapshot: NagishonState = DEFAULT_STATE;
function subscribe(cb: () => void): () => void {
  const fn = () => cb();
  window.addEventListener("nagishon:change", fn);
  window.addEventListener("nagishon:ready", fn);
  return () => {
    window.removeEventListener("nagishon:change", fn);
    window.removeEventListener("nagishon:ready", fn);
  };
}
function getSnapshot(): NagishonState {
  const inst = get();
  if (inst) {
    const s = inst.getState();
    if (s !== snapshot) snapshot = s;
  }
  return snapshot;
}

export function useNagishon() {
  const state = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_STATE);
  const instance: NagishonInstance | null = typeof window === "undefined" ? null : get();
  return {
    state,
    instance,
    set: ((k, v) => get()?.set(k, v)) as NagishonInstance["set"],
    setState: (p: Partial<NagishonState>) => get()?.setState(p),
    reset: () => get()?.reset(),
    open: () => get()?.open(),
    close: () => get()?.close(),
  };
}

export { NAGISHON_PREPAINT } from "../prepaint";
