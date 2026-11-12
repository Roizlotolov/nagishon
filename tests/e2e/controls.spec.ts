import { expect, test } from "@playwright/test";
import {
  ATTR_BY_KEY,
  STORAGE_KEY,
  closeDialog,
  htmlAttr,
  liveRegion,
  openDialog,
  presentBooleanAttrs,
  pressedButton,
  resetButton,
  switchByKey,
  type ToggleKey,
} from "./helpers";

const KEYS = Object.keys(ATTR_BY_KEY) as ToggleKey[];

test.describe("controls", () => {
  for (const key of KEYS) {
    test(`switch "${key}" sets and removes ${ATTR_BY_KEY[key]}`, async ({ page }) => {
      await page.goto("/");
      await openDialog(page);
      const sw = switchByKey(page, key);
      await expect(sw).toBeVisible();
      await expect(sw).toHaveAttribute("aria-checked", "false");
      await expect(page.locator("html")).not.toHaveAttribute(ATTR_BY_KEY[key], /.*/);

      await sw.click();
      await expect(sw).toHaveAttribute("aria-checked", "true");
      await expect(page.locator("html")).toHaveAttribute(ATTR_BY_KEY[key], "");

      await sw.click();
      await expect(sw).toHaveAttribute("aria-checked", "false");
      await expect(page.locator("html")).not.toHaveAttribute(ATTR_BY_KEY[key], /.*/);
    });
  }

  test("contrast buttons set data-nagish-contrast and aria-pressed", async ({ page }) => {
    await page.goto("/");
    await openDialog(page);
    const dark = pressedButton(page, /כהה/).first();
    const light = pressedButton(page, /בהיר/).first();
    const none = pressedButton(page, /רגיל/).first();

    await dark.click();
    await expect(dark).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("html")).toHaveAttribute("data-nagish-contrast", "dark");
    await light.click();
    await expect(light).toHaveAttribute("aria-pressed", "true");
    await expect(dark).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator("html")).toHaveAttribute("data-nagish-contrast", "light");
    await none.click();
    await expect(none).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("html")).toHaveAttribute("data-nagish-contrast", "none");
  });

  test("text size 150% scales a paragraph by 1.5x and 100% restores it exactly", async ({ page }) => {
    await page.goto("/");
    await openDialog(page);
    const para = page.locator("h2#about + p");
    const size = () => para.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    const original = await size();
    expect(original).toBeGreaterThan(0);

    const p150 = pressedButton(page, "150%").first();
    await p150.click();
    await expect(p150).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("html")).toHaveAttribute("data-nagish-text", "1.5");
    await expect.poll(size).toBeCloseTo(original * 1.5, 1);

    await pressedButton(page, "100%").first().click();
    await expect(page.locator("html")).toHaveAttribute("data-nagish-text", "1");
    await expect.poll(size).toBe(original);
    await expect(para).not.toHaveAttribute("style", /font-size/);
  });

  test("stop motion pauses the autoplay video", async ({ page }) => {
    await page.goto("/");
    const video = page.locator("video");
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(false);
    await openDialog(page);
    await switchByKey(page, "stopMotion").click();
    await expect(page.locator("html")).toHaveAttribute("data-nagish-motion", "");
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  });

  test("changes are announced in the polite live region", async ({ page }) => {
    await page.goto("/");
    await openDialog(page);
    await switchByKey(page, "grayscale").click();
    await expect(liveRegion(page)).not.toHaveText("");
  });

  test("reset clears the storage key and every attribute", async ({ page }) => {
    await page.goto("/");
    await openDialog(page);
    await switchByKey(page, "underlineLinks").click();
    await switchByKey(page, "textSpacing").click();
    await pressedButton(page, /כהה/).first().click();
    await pressedButton(page, "125%").first().click();
    await expect.poll(() => page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY)).not.toBeNull();

    await resetButton(page).click();

    await expect.poll(() => page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY)).toBeNull();
    await expect.poll(() => presentBooleanAttrs(page)).toEqual([]);
    expect(["none", null]).toContain(await htmlAttr(page, "data-nagish-contrast"));
    expect(["1", null]).toContain(await htmlAttr(page, "data-nagish-text"));
    for (const key of KEYS) await expect(switchByKey(page, key)).toHaveAttribute("aria-checked", "false");
    await closeDialog(page);
  });
});
