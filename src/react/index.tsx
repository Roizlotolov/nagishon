"use client";
// STUB (Phase A): replaced by the UI agent.
import { useEffect } from "react";
import { init, type NagishOptions } from "../index";

export function NagishWidget(props: NagishOptions): null {
  useEffect(() => {
    const instance = init(props);
    return () => instance.destroy();
  }, [props]);
  return null;
}

export { NAGISH_PREPAINT } from "../prepaint";
