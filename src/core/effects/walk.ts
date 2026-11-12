/** Runs `fn` over `items` in chunks yielding to the event loop between chunks. The first chunk runs synchronously. */
export function runChunked<T>(
  items: readonly T[],
  fn: (item: T) => void,
  chunkSize: number,
  isCancelled: () => boolean,
  done?: () => void,
): void {
  let i = 0;
  const step = () => {
    if (isCancelled()) return;
    const end = Math.min(i + chunkSize, items.length);
    for (; i < end; i++) fn(items[i]);
    if (i < items.length) setTimeout(step, 0);
    else done?.();
  };
  step();
}

/** True when the element is part of the widget (or one of its helper nodes). */
export function isNagishonNode(el: Element): boolean {
  return el.closest("[data-nagishon-root]") !== null;
}
