// STUB (Phase A): replaced by the UI agent. Defines the public API surface types.
import type { Contrast, NagishState, TextScale } from "./core/state";
import type { Locale } from "./i18n";

export interface NagishOptions {
  locale?: Locale | (string & {});
  dir?: "rtl" | "ltr";
  position?: "start" | "end";
  offset?: { block?: number; inline?: number };
  statementUrl?: string;
  contactUrl?: string;
  hotkey?: string | false;
  textScaling?: "elements" | "root";
  skipLink?: { target: string; label?: string } | false;
  features?: Partial<Record<keyof NagishState, boolean>>;
  theme?: Partial<{ accent: string; background: string; foreground: string; radius: string; zIndex: number }>;
  launcher?: { label?: string; showText?: boolean; hidden?: boolean };
  initialState?: Partial<NagishState>;
  storageKey?: string;
  onChange?: (state: NagishState) => void;
}

export interface NagishInstance {
  open(): void;
  close(): void;
  toggle(): void;
  getState(): NagishState;
  set<K extends keyof NagishState>(key: K, value: NagishState[K]): void;
  setState(patch: Partial<NagishState>): void;
  reset(): void;
  on(event: "change" | "open" | "close", cb: (state: NagishState) => void): () => void;
  destroy(): void;
  readonly options: Readonly<Required<Pick<NagishOptions, "locale" | "dir" | "position">>> & NagishOptions;
}

export function init(_options?: NagishOptions): NagishInstance {
  throw new Error("nagish: not implemented");
}

export function get(): NagishInstance | null {
  throw new Error("nagish: not implemented");
}

export { DEFAULT_STATE, normalizeState } from "./core/state";
export type { NagishState, TextScale, Contrast };
