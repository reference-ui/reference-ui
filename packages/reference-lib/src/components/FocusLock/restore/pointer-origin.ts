/**
 * Safari's missing opener: pointer activation never moves focus there, so an
 * opening click would leave body as the lock's restore origin. The module
 * records the last pointerdown target per document — installed for the main
 * document at import, SSR-guarded, other ownerDocuments joining on
 * activation — and lastPointerOrigin hands the live node back to origin
 * capture as its fallback.
 */

const pointerOriginByDoc = new WeakMap<Document, HTMLElement | null>()

export function trackPointerOrigin(doc: Document) {
  if (pointerOriginByDoc.has(doc)) return
  pointerOriginByDoc.set(doc, null)
  doc.addEventListener(
    'pointerdown',
    event => {
      const target = event.target
      pointerOriginByDoc.set(doc, target instanceof HTMLElement ? target : null)
    },
    true
  )
}

export function lastPointerOrigin(doc: Document): HTMLElement | null {
  const node = pointerOriginByDoc.get(doc)
  return node && node.isConnected ? node : null
}

// Install early: the opening pointerdown precedes the lock's mount, so
// tracking must already be live when the first lock activates.
if (typeof document !== 'undefined') {
  trackPointerOrigin(document)
}
