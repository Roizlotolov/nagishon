import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page } from "@playwright/test";

export const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

/** state key -> attribute set on <html> */
export const ATTR_BY_KEY = {
  grayscale: "data-nagish-grayscale",
  underlineLinks: "data-nagish-links",
  highlightHeadings: "data-nagish-headings",
  readableFont: "data-nagish-font",
  textSpacing: "data-nagish-spacing",
  stopMotion: "data-nagish-motion",
  bigCursor: "data-nagish-cursor",
  readingGuide: "data-nagish-guide",
} as const;
export type ToggleKey = keyof typeof ATTR_BY_KEY;

export const STORAGE_KEY = "nagish:v1";

export function launcher(page: Page): Locator {
  return page.locator('nagish-widget[data-nagish-root] button[aria-haspopup="dialog"]');
}

export function dialog(page: Page): Locator {
  return page.locator('nagish-widget[data-nagish-root] [role="dialog"]');
}

export function dialogTitle(page: Page): Locator {
  return page.locator("nagish-widget[data-nagish-root] #nagish-title");
}

export function switchByKey(page: Page, key: ToggleKey): Locator {
  return page.locator(`nagish-widget[data-nagish-root] button[role="switch"][data-key="${key}"]`);
}

export function resetButton(page: Page): Locator {
  return page.locator('nagish-widget[data-nagish-root] [data-action="reset"]');
}

export function closeButton(page: Page): Locator {
  return page.locator('nagish-widget[data-nagish-root] [data-action="close"]');
}

export function liveRegion(page: Page): Locator {
  return page.locator('nagish-widget[data-nagish-root] [aria-live="polite"]');
}

/** A text-size or contrast button (both use aria-pressed), matched by visible text. */
export function pressedButton(page: Page, text: string | RegExp): Locator {
  return page.locator("nagish-widget[data-nagish-root] button[aria-pressed]").filter({ hasText: text });
}

/** Waits for the widget to mount (launcher visible). */
export async function waitForWidget(page: Page): Promise<void> {
  await expect(launcher(page)).toBeVisible();
}

export async function openDialog(page: Page): Promise<void> {
  await waitForWidget(page);
  await launcher(page).click();
  await expect(dialog(page)).toBeVisible();
}

export async function closeDialog(page: Page): Promise<void> {
  await closeButton(page).click();
  await expect(dialog(page)).toBeHidden();
}

export async function runAxe(page: Page) {
  return new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
}

/** Formats axe violations so a failure is readable. */
export function describeViolations(violations: { id: string; help: string; nodes: { target: unknown }[] }[]): string {
  return violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => JSON.stringify(n.target)).join(", ")})`).join("\n");
}

/** Reads the host page's <html> attribute. */
export function htmlAttr(page: Page, name: string): Promise<string | null> {
  return page.evaluate((n) => document.documentElement.getAttribute(n), name);
}

/** Names of all boolean data-nagish-* attributes currently present on <html>. */
export function presentBooleanAttrs(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    document.documentElement
      .getAttributeNames()
      .filter((n) => n.startsWith("data-nagish-") && n !== "data-nagish-text" && n !== "data-nagish-contrast"),
  );
}

/** True when the element that holds focus (piercing the widget's shadow root) is inside the dialog. */
export function focusInsideDialog(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const host = document.querySelector("nagish-widget[data-nagish-root]");
    const active = host?.shadowRoot?.activeElement;
    return document.activeElement === host && !!active && !!active.closest('[role="dialog"]');
  });
}

/** Presses Tab until `target` has focus (max `limit` presses). */
export async function tabUntilFocused(page: Page, target: Locator, limit = 80): Promise<void> {
  for (let i = 0; i < limit; i++) {
    await page.keyboard.press("Tab");
    const focused = await target.evaluate((el) => (el.getRootNode() as Document | ShadowRoot).activeElement === el);
    if (focused) return;
  }
  throw new Error(`Tab never reached the target within ${limit} presses`);
}
