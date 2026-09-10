/** ResizeObserver box that matches `getBoundingClientRect` (border box). */
export const RESIZE_OBSERVER_BOX = 'border-box' as const

/**
 * ResizeObserver constructor for `element`'s document. Iframe / foreign
 * `Document` nodes must not use the top window's observer (MS-DOC-01).
 */
export function resizeObserverFor(element: Element): typeof ResizeObserver | undefined {
  const fromView = element.ownerDocument.defaultView?.ResizeObserver
  if (typeof fromView === 'function') return fromView
  if (typeof ResizeObserver === 'function') return ResizeObserver
  return undefined
}

/**
 * Observe an element for border-box size. Older engines that reject the
 * `box` option fall back to the default content-box observe.
 */
export function observeElementResize(observer: ResizeObserver, element: Element): void {
  try {
    observer.observe(element, { box: RESIZE_OBSERVER_BOX })
  } catch {
    observer.observe(element)
  }
}
