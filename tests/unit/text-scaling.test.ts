import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setTextScale, teardownTextScaling } from "../../src/core/effects/text-scaling";

function setup() {
  document.body.innerHTML = `
    <p id="a" style="font-size: 20px">שלום עולם</p>
    <p id="b" style="font-size: 16px !important; line-height: 24px">עוד טקסט</p>
    <div id="empty" style="font-size: 30px"><span id="c" style="font-size: 10px">x</span></div>
    <nagishon-widget data-nagishon-root><p id="w" style="font-size: 18px">widget</p></nagishon-widget>
  `;
  return (id: string) => document.getElementById(id) as HTMLElement;
}

describe("text scaling (elements)", () => {
  let $: (id: string) => HTMLElement;
  beforeEach(() => {
    document.documentElement.removeAttribute("style");
    $ = setup();
  });
  afterEach(() => {
    teardownTextScaling();
    document.body.innerHTML = "";
  });

  it("scales font-size and line-height by the factor", () => {
    setTextScale(1.5);
    expect($("a").style.fontSize).toBe("30px");
    expect($("a").style.getPropertyPriority("font-size")).toBe("important");
    expect($("b").style.fontSize).toBe("24px");
    expect($("b").style.lineHeight).toBe("36px");
    expect($("c").style.fontSize).toBe("15px");
  });

  it("does not touch the widget subtree or text-less containers", () => {
    setTextScale(2);
    expect($("w").style.fontSize).toBe("18px");
    expect($("empty").style.fontSize).toBe("30px");
  });

  it("restores exact original inline values (value, priority, or absence) at scale 1", () => {
    document.body.insertAdjacentHTML("beforeend", `<p id="d">no inline</p>`);
    $("d").style.fontSize = "";
    setTextScale(1.5);
    setTextScale(1);
    expect($("a").style.fontSize).toBe("20px");
    expect($("a").style.getPropertyPriority("font-size")).toBe("");
    expect($("b").style.fontSize).toBe("16px");
    expect($("b").style.getPropertyPriority("font-size")).toBe("important");
    expect($("b").style.lineHeight).toBe("24px");
    expect(document.querySelectorAll("[data-nagishon-scaled]").length).toBe(0);
  });

  it("removes the property and empty style attribute when there was no inline value", () => {
    const p = document.createElement("p");
    p.id = "e";
    p.textContent = "plain";
    document.body.appendChild(p);
    // jsdom computes no font-size without a rule: give one through a stylesheet
    const st = document.createElement("style");
    st.textContent = "#e { font-size: 12px }";
    document.head.appendChild(st);
    setTextScale(1.5);
    expect(p.style.fontSize).toBe("18px");
    setTextScale(1);
    expect(p.style.fontSize).toBe("");
    expect(p.hasAttribute("style")).toBe(false);
    st.remove();
  });

  it("re-scaling uses the captured originals (no compounding)", () => {
    setTextScale(1.5);
    setTextScale(2);
    expect($("a").style.fontSize).toBe("40px");
    setTextScale(1.25);
    expect($("a").style.fontSize).toBe("25px");
    setTextScale(1);
    expect($("a").style.fontSize).toBe("20px");
  });

  it("scales elements added later while scale is not 1", async () => {
    setTextScale(1.5);
    const p = document.createElement("p");
    p.style.fontSize = "10px";
    p.textContent = "late";
    document.body.appendChild(p);
    await new Promise((r) => setTimeout(r, 30));
    expect(p.style.fontSize).toBe("15px");
    setTextScale(1);
    expect(p.style.fontSize).toBe("10px");
  });
});

describe("text scaling (root)", () => {
  afterEach(() => {
    teardownTextScaling();
    document.documentElement.removeAttribute("style");
  });

  it("scales the root font-size and restores the inline original", () => {
    document.documentElement.style.fontSize = "16px";
    setTextScale(1.5, "root");
    expect(document.documentElement.style.fontSize).toBe("24px");
    setTextScale(1, "root");
    expect(document.documentElement.style.fontSize).toBe("16px");
  });

  it("removes the property when there was none", () => {
    document.documentElement.removeAttribute("style");
    setTextScale(1.25, "root");
    expect(document.documentElement.style.fontSize).not.toBe("");
    setTextScale(1, "root");
    expect(document.documentElement.style.fontSize).toBe("");
  });
});
