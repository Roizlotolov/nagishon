import { expect, test } from "@playwright/test";
import { describeViolations, openDialog, pressedButton, runAxe, waitForWidget } from "./helpers";

test.describe("axe (wcag2a, wcag2aa, wcag21a, wcag21aa)", () => {
  test("demo page, dialog closed: zero violations", async ({ page }) => {
    await page.goto("/");
    await waitForWidget(page);
    const { violations } = await runAxe(page);
    expect(violations, describeViolations(violations)).toEqual([]);
  });

  test("demo page, dialog open: zero violations", async ({ page }) => {
    await page.goto("/");
    await openDialog(page);
    const { violations } = await runAxe(page);
    expect(violations, describeViolations(violations)).toEqual([]);
  });

  test("dialog open with page contrast dark: zero violations", async ({ page }) => {
    await page.goto("/");
    await openDialog(page);
    await pressedButton(page, /כהה/).first().click();
    await expect(page.locator("html")).toHaveAttribute("data-nagish-contrast", "dark");
    const { violations } = await runAxe(page);
    expect(violations, describeViolations(violations)).toEqual([]);
  });

  test("locale en (LTR), closed and open: zero violations", async ({ page }) => {
    await page.goto("/en.html");
    await waitForWidget(page);
    await expect(page.locator("nagish-widget[data-nagish-root]")).toHaveAttribute("dir", "ltr");
    let result = await runAxe(page);
    expect(result.violations, describeViolations(result.violations)).toEqual([]);
    await openDialog(page);
    result = await runAxe(page);
    expect(result.violations, describeViolations(result.violations)).toEqual([]);
  });
});
