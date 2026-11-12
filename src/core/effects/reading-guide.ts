let guide: HTMLDivElement | null = null;
let raf = 0;
let nextY = 0;

function onMove(e: PointerEvent): void {
  if (e.pointerType === "touch") return;
  nextY = e.clientY;
  if (raf || !guide) return;
  raf = requestAnimationFrame(() => {
    raf = 0;
    if (guide) guide.style.transform = `translateY(${Math.round(nextY - 6)}px)`;
  });
}

export function isFinePointer(): boolean {
  return typeof matchMedia === "function" ? matchMedia("(pointer: fine)").matches : false;
}

export function enableReadingGuide(): void {
  if (guide || !isFinePointer()) return;
  guide = document.createElement("div");
  guide.setAttribute("data-nagishon-root", "guide");
  guide.setAttribute("aria-hidden", "true");
  guide.style.transform = "translateY(-100px)";
  document.body.appendChild(guide);
  document.addEventListener("pointermove", onMove, { passive: true });
}

export function disableReadingGuide(): void {
  document.removeEventListener("pointermove", onMove);
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  guide?.remove();
  guide = null;
}
