export type TextScale = 1 | 1.25 | 1.5 | 1.75 | 2;
export type Contrast = "none" | "dark" | "light";

export interface NagishState {
  textScale: TextScale;
  contrast: Contrast;
  grayscale: boolean;
  underlineLinks: boolean;
  highlightHeadings: boolean;
  readableFont: boolean;
  textSpacing: boolean;
  stopMotion: boolean;
  bigCursor: boolean;
  readingGuide: boolean;
}

export const DEFAULT_STATE: Readonly<NagishState> = Object.freeze({
  textScale: 1,
  contrast: "none",
  grayscale: false,
  underlineLinks: false,
  highlightHeadings: false,
  readableFont: false,
  textSpacing: false,
  stopMotion: false,
  bigCursor: false,
  readingGuide: false,
});

export const TEXT_SCALES: readonly TextScale[] = [1, 1.25, 1.5, 1.75, 2];
export const DEFAULT_STORAGE_KEY = "nagish:v1";

/**
 * Accepts any input and returns a valid state.
 * SELF-CONTAINED: stringified into the pre-paint snippet. No imports, no closures over
 * module state, no helpers, no default-parameter/spread syntax that a compiler could lower.
 */
export function normalizeState(input: unknown): NagishState {
  const o: Record<string, unknown> =
    input !== null && typeof input === "object" && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {};
  const scales = [1, 1.25, 1.5, 1.75, 2];
  const raw = typeof o.textScale === "string" ? Number(o.textScale) : o.textScale;
  const contrast = o.contrast === "dark" || o.contrast === "light" ? o.contrast : "none";
  return {
    textScale: (typeof raw === "number" && scales.indexOf(raw) !== -1 ? raw : 1) as TextScale,
    contrast: contrast as Contrast,
    grayscale: o.grayscale === true,
    underlineLinks: o.underlineLinks === true,
    highlightHeadings: o.highlightHeadings === true,
    readableFont: o.readableFont === true,
    textSpacing: o.textSpacing === true,
    stopMotion: o.stopMotion === true,
    bigCursor: o.bigCursor === true,
    readingGuide: o.readingGuide === true,
  };
}

const KEYS = Object.keys(DEFAULT_STATE) as (keyof NagishState)[];

export function isDefaultState(state: NagishState): boolean {
  return KEYS.every((k) => state[k] === DEFAULT_STATE[k]);
}

export function statesEqual(a: NagishState, b: NagishState): boolean {
  return KEYS.every((k) => a[k] === b[k]);
}

/** Reads and normalizes the stored state; returns null when nothing is stored (or storage is unavailable). */
export function readStoredState(key: string = DEFAULT_STORAGE_KEY): NagishState | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    return normalizeState(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** Persists the state; removes the key entirely when the state equals DEFAULT_STATE. */
export function writeStoredState(state: NagishState, key: string = DEFAULT_STORAGE_KEY): void {
  try {
    if (isDefaultState(state)) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(state));
  } catch {
    /* storage unavailable (private mode, quota): state still works for the session */
  }
}

export type StateListener = (state: NagishState) => void;

export interface StateStore {
  get(): NagishState;
  set(patch: Partial<NagishState>): NagishState;
  reset(): NagishState;
  subscribe(listener: StateListener): () => void;
  destroy(): void;
}

/**
 * In-memory store backed by localStorage with cross-tab sync through the `storage` event.
 * `initial` applies only when nothing is stored.
 */
export function createStateStore(
  key: string = DEFAULT_STORAGE_KEY,
  initial?: Partial<NagishState>,
): StateStore {
  const listeners = new Set<StateListener>();
  let state = readStoredState(key) ?? normalizeState({ ...DEFAULT_STATE, ...initial });

  const emit = () => listeners.forEach((l) => l(state));

  const onStorage = (e: StorageEvent) => {
    // key === null means storage.clear()
    if (e.key !== null && e.key !== key) return;
    const next = e.newValue === null ? normalizeState(null) : readStoredState(key) ?? normalizeState(null);
    if (statesEqual(next, state)) return;
    state = next;
    emit();
  };
  window.addEventListener("storage", onStorage);

  return {
    get: () => state,
    set(patch) {
      const next = normalizeState({ ...state, ...patch });
      if (statesEqual(next, state)) return state;
      state = next;
      writeStoredState(state, key);
      emit();
      return state;
    },
    reset() {
      const next = normalizeState(null);
      const changed = !statesEqual(next, state);
      state = next;
      writeStoredState(state, key);
      if (changed) emit();
      return state;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    destroy() {
      window.removeEventListener("storage", onStorage);
      listeners.clear();
    },
  };
}
