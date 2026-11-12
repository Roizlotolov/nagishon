import { get, init } from "./index";
import { optionsFromDataset } from "./options-from-dataset";

declare const __NAGISHON_VERSION__: string;
export const version: string = typeof __NAGISHON_VERSION__ === "string" ? __NAGISHON_VERSION__ : "1.0.0";
export { get, init };

const script =
  (document.currentScript as HTMLScriptElement | null) || document.querySelector<HTMLScriptElement>("script[data-nagishon]");
if (script && !("nagishonManual" in script.dataset)) {
  const ds = script.dataset;
  if ("nagishon" in ds || Object.keys(ds).length) init(optionsFromDataset(ds));
}
