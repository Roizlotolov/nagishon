import { get, init } from "./index";
import { optionsFromDataset } from "./options-from-dataset";

declare const __NAGISH_VERSION__: string;
export const version: string = typeof __NAGISH_VERSION__ === "string" ? __NAGISH_VERSION__ : "1.0.0";
export { get, init };

const script =
  (document.currentScript as HTMLScriptElement | null) || document.querySelector<HTMLScriptElement>("script[data-nagish]");
if (script && !("nagishManual" in script.dataset)) {
  const ds = script.dataset;
  if ("nagish" in ds || Object.keys(ds).length) init(optionsFromDataset(ds));
}
