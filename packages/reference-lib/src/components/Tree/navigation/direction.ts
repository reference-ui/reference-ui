/**
 * Tree's direction resolution (TR-ENV-03): closest('[dir]') stops at a
 * shadow root, so climb through hosts until the document. Light-DOM
 * behavior is unchanged: the first closest() hit wins, and the
 * document.dir fallback runs only when no [dir] exists anywhere above.
 * DOM-bound; tests prove it against fakes cast to HTMLElement.
 */

export function resolveIsRtl(rootEl: HTMLElement): boolean {
  let node: Element | null = rootEl
  while (node) {
    const dirEl = node.closest('[dir]')
    if (dirEl) {
      return (dirEl as HTMLElement).dir === 'rtl'
    }
    const host: unknown = (node.getRootNode() as ShadowRoot).host
    if (host instanceof Element) {
      node = host
    } else {
      break
    }
  }
  return typeof document !== 'undefined' && document.dir === 'rtl'
}
