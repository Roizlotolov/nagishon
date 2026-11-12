import { expect, test } from "@playwright/test";
import { STORAGE_KEY, openDialog, pressedButton, switchByKey } from "./helpers";

for (const path of ["/", "/iife.html"]) {
  test(`persistence on ${path}: contrast is applied before DOMContentLoaded and the dialog reflects it`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => {
        (window as unknown as Record<string, unknown>).__nagishAtDCL = document.documentElement.getAttribute(
          "data-nagish-contrast",
        );
      });
    });

    await page.goto(path);
    await openDialog(page);
    await pressedButton(page, /כהה/).first().click();
    await switchByKey(page, "underlineLinks").click();
    await expect(page.locator("html")).toHaveAttribute("data-nagish-contrast", "dark");
    await expect.poll(() => page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY)).toContain('"contrast":"dark"');

    await page.reload();
    const atDcl = await page.evaluate(() => (window as unknown as Record<string, unknown>).__nagishAtDCL);
    expect(atDcl).toBe("dark");
    await expect(page.locator("html")).toHaveAttribute("data-nagish-links", "");

    await openDialog(page);
    await expect(pressedButton(page, /כהה/).first()).toHaveAttribute("aria-pressed", "true");
    await expect(switchByKey(page, "underlineLinks")).toHaveAttribute("aria-checked", "true");
    await expect(switchByKey(page, "grayscale")).toHaveAttribute("aria-checked", "false");
  });
}
