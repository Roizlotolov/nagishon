import { expect, test } from "@playwright/test";
import { launcher, waitForWidget } from "./helpers";

test("IIFE page: window.Nagish.get() returns an instance and there are no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console.error: ${m.text()}`);
  });

  await page.goto("/iife.html");
  await waitForWidget(page);
  const info = await page.evaluate(() => {
    const n = (window as unknown as { Nagish?: { get(): unknown; init: unknown; version?: string } }).Nagish;
    const instance = n?.get() as Record<string, unknown> | null | undefined;
    return {
      hasGlobal: !!n,
      hasInit: typeof n?.init === "function",
      hasInstance: !!instance,
      hasOpen: typeof instance?.open === "function",
    };
  });
  expect(info).toEqual({ hasGlobal: true, hasInit: true, hasInstance: true, hasOpen: true });
  expect(errors).toEqual([]);
});

test("IIFE auto-init wires the statement link and skip link from data attributes", async ({ page }) => {
  await page.goto("/iife.html");
  await waitForWidget(page);
  await expect(page.locator("a.nagish-skip")).toHaveAttribute("href", "#main");
  await launcher(page).click();
  await expect(page.locator('nagish-widget[data-nagish-root] a[href="/statement.html"]')).toBeVisible();
});

test("hostile host CSS: the launcher keeps a usable size and stays visible", async ({ page }) => {
  await page.goto("/");
  await waitForWidget(page);
  const l = launcher(page);
  await expect(l).toBeVisible();
  await expect(l).toBeInViewport();
  const box = await l.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(48);
  expect(box!.height).toBeGreaterThanOrEqual(48);
});

test("RTL and LTR follow the locale", async ({ page }) => {
  await page.goto("/");
  await waitForWidget(page);
  await expect(page.locator("nagish-widget[data-nagish-root]")).toHaveAttribute("dir", "rtl");
  await page.goto("/en.html");
  await waitForWidget(page);
  await expect(page.locator("nagish-widget[data-nagish-root]")).toHaveAttribute("dir", "ltr");
});
