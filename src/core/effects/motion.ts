const PAUSED = "data-nagishon-paused";
const MEDIA = "video, audio";

let observer: MutationObserver | null = null;

function pauseMedia(m: HTMLMediaElement): void {
  if (!m.hasAttribute("autoplay") && !m.autoplay) return;
  m.removeAttribute("autoplay");
  m.autoplay = false;
  try {
    m.pause();
  } catch {
    /* jsdom / unsupported */
  }
  m.setAttribute(PAUSED, "");
}

function handleNode(node: Node): void {
  if (!(node instanceof Element)) return;
  if (node.closest("[data-nagishon-root]")) return;
  if (node.matches(MEDIA)) pauseMedia(node as HTMLMediaElement);
  node.querySelectorAll(MEDIA).forEach((m) => pauseMedia(m as HTMLMediaElement));
  stopMarquees(node);
}

function stopMarquees(root: Element | Document): void {
  root.querySelectorAll("marquee").forEach((m) => {
    const mq = m as HTMLElement & { stop?: () => void };
    mq.stop?.();
  });
}

export function enableMotionStop(): void {
  document.querySelectorAll(MEDIA).forEach((m) => {
    if (m.closest("[data-nagishon-root]")) return;
    pauseMedia(m as HTMLMediaElement);
  });
  stopMarquees(document);
  if (observer) return;
  observer = new MutationObserver((records) => {
    for (const r of records) r.addedNodes.forEach(handleNode);
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

/** Best-effort resume of media that nagishon paused. */
export function disableMotionStop(): void {
  observer?.disconnect();
  observer = null;
  document.querySelectorAll(`[${PAUSED}]`).forEach((el) => {
    const m = el as HTMLMediaElement;
    m.removeAttribute(PAUSED);
    if (m.loop || m.muted) {
      try {
        const p = m.play() as Promise<void> | undefined;
        p?.catch(() => undefined);
      } catch {
        /* ignore */
      }
    }
  });
  document.querySelectorAll("marquee").forEach((m) => {
    const mq = m as HTMLElement & { start?: () => void };
    mq.start?.();
  });
}
