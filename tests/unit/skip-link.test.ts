import { afterEach, describe, expect, it } from "vitest";
import { disableSkipLink, enableSkipLink } from "../../src/core/effects/skip-link";

afterEach(() => {
  disableSkipLink();
  document.body.innerHTML = "";
});

describe("skip link", () => {
  it("injects as first child of body with default Hebrew label", () => {
    document.body.innerHTML = `<header>h</header><main id="main">m</main>`;
    enableSkipLink({ target: "#main" });
    const a = document.body.firstElementChild as HTMLAnchorElement;
    expect(a.tagName).toBe("A");
    expect(a.className).toBe("nagishon-skip");
    expect(a.getAttribute("href")).toBe("#main");
    expect(a.textContent).toBe("דילוג לתוכן המרכזי");
  });

  it("uses a custom label and the locale default", () => {
    document.body.innerHTML = `<main id="main"></main>`;
    enableSkipLink({ target: "#main", label: "קפיצה" });
    expect(document.querySelector(".nagishon-skip")?.textContent).toBe("קפיצה");
    enableSkipLink({ target: "#main" }, "en");
    expect(document.querySelectorAll(".nagishon-skip").length).toBe(1);
    expect(document.querySelector(".nagishon-skip")?.textContent).toBe("Skip to main content");
  });

  it("on click sets tabindex=-1 and focuses a target without tabindex", () => {
    document.body.innerHTML = `<main id="main">m</main>`;
    enableSkipLink({ target: "#main" });
    (document.querySelector(".nagishon-skip") as HTMLElement).click();
    const main = document.getElementById("main")!;
    expect(main.getAttribute("tabindex")).toBe("-1");
    expect(document.activeElement).toBe(main);
  });

  it("preserves an existing tabindex and resolves non-id selectors", () => {
    document.body.innerHTML = `<section class="content" tabindex="0">m</section>`;
    enableSkipLink({ target: ".content" });
    const a = document.querySelector<HTMLAnchorElement>(".nagishon-skip")!;
    expect(a.getAttribute("href")).toBe("#nagishon-skip-target");
    a.click();
    expect(document.querySelector(".content")!.getAttribute("tabindex")).toBe("0");
  });

  it("does nothing when the target is missing, and disable removes it", () => {
    enableSkipLink({ target: "#nope" });
    expect(document.querySelector(".nagishon-skip")).toBeNull();
    document.body.innerHTML = `<main id="main"></main>`;
    enableSkipLink({ target: "#main" });
    disableSkipLink();
    expect(document.querySelector(".nagishon-skip")).toBeNull();
  });
});
