import { expect, test } from "@playwright/test";
import { dialog, dialogTitle, focusInsideDialog, launcher, tabUntilFocused, waitForWidget } from "./helpers";

test.describe("keyboard", () => {
  test("Tab reaches the launcher, Enter opens, focus trap, Escape returns focus", async ({ page }) => {
    await page.goto("/");
    await waitForWidget(page);

    await tabUntilFocused(page, launcher(page));
    await expect(launcher(page)).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(dialog(page)).toBeVisible();
    await expect(dialogTitle(page)).toBeFocused();

    // Tab cycles inside the dialog only (forward, then backward).
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      expect(await focusInsideDialog(page), `forward Tab #${i + 1} left the dialog`).toBe(true);
    }
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Shift+Tab");
      expect(await focusInsideDialog(page), `Shift+Tab #${i + 1} left the dialog`).toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(dialog(page)).toBeHidden();
    await expect(launcher(page)).toBeFocused();
  });

  test("hotkey Alt+Shift+A opens and closes the dialog", async ({ page }) => {
    await page.goto("/");
    await waitForWidget(page);
    await page.keyboard.press("Alt+Shift+A");
    await expect(dialog(page)).toBeVisible();
    await page.keyboard.press("Alt+Shift+A");
    await expect(dialog(page)).toBeHidden();
  });

  test("skip link appears on first Tab and moves focus to #main", async ({ page }) => {
    await page.goto("/");
    await waitForWidget(page);
    await page.keyboard.press("Tab");
    const skip = page.locator("a.nagishon-skip");
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main")).toBeFocused();
  });
});
