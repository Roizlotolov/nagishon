import { applyAttrs, clearAttrs } from "../attrs";
import type { NagishState } from "../state";
import { markIconFonts, unmarkIconFonts } from "./font";
import { injectStyles, removeStyles } from "./inject-styles";
import { disableMotionStop, enableMotionStop } from "./motion";
import { disableReadingGuide, enableReadingGuide } from "./reading-guide";
import { disableSkipLink, enableSkipLink, type SkipLinkOptions } from "./skip-link";
import { setTextScale, teardownTextScaling, type TextScalingStrategy } from "./text-scaling";

export interface EffectsOptions {
  textScaling?: TextScalingStrategy;
  skipLink?: SkipLinkOptions | false;
  locale?: string;
}

/**
 * Applies the state to the page: data-nagish-* attributes (CSS effects) plus the JS-driven effects.
 * `prev` is the previously applied state (null on first call); only changed features are touched.
 */
export function applyEffects(state: NagishState, prev: NagishState | null, options: EffectsOptions = {}): void {
  injectStyles();
  applyAttrs(state);

  if (!prev || prev.textScale !== state.textScale) {
    setTextScale(state.textScale, options.textScaling ?? "elements");
  }
  if (!prev || prev.readableFont !== state.readableFont) {
    if (state.readableFont) markIconFonts();
    else unmarkIconFonts();
  }
  if (!prev || prev.stopMotion !== state.stopMotion) {
    if (state.stopMotion) enableMotionStop();
    else if (prev) disableMotionStop();
  }
  if (!prev || prev.readingGuide !== state.readingGuide) {
    if (state.readingGuide) enableReadingGuide();
    else disableReadingGuide();
  }
  if (!prev) {
    if (options.skipLink) enableSkipLink(options.skipLink, options.locale);
  }
}

/** Reverts everything applyEffects did. Leaves localStorage alone. */
export function teardownEffects(): void {
  teardownTextScaling();
  unmarkIconFonts();
  disableMotionStop();
  disableReadingGuide();
  disableSkipLink();
  clearAttrs();
  removeStyles();
}

export { injectStyles } from "./inject-styles";
export { enableSkipLink, disableSkipLink } from "./skip-link";
export { setTextScale } from "./text-scaling";
