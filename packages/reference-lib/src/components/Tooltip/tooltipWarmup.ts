interface TooltipRuntimeStore {
  warmUntil: number
  skipDelay: number
}
const tooltipStores = new WeakMap<Document, TooltipRuntimeStore>()

function getTooltipStore(doc?: Document): TooltipRuntimeStore {
  const targetDoc = doc ?? (typeof document !== 'undefined' ? document : undefined)
  if (!targetDoc) return { warmUntil: 0, skipDelay: 300 }
  let store = tooltipStores.get(targetDoc)
  if (!store) {
    store = { warmUntil: 0, skipDelay: 300 }
    tooltipStores.set(targetDoc, store)
  }
  return store
}

export const tooltipWarmup = {
  isWarmed(doc?: Document): boolean {
    const store = getTooltipStore(doc)
    return Date.now() < store.warmUntil
  },
  warm(doc?: Document) {
    const store = getTooltipStore(doc)
    store.warmUntil = Date.now() + (store.skipDelay || 300)
  },
  reset(doc?: Document) {
    const store = getTooltipStore(doc)
    store.warmUntil = 0
  },
  setSkipDelay(delay: number, doc?: Document) {
    const store = getTooltipStore(doc)
    store.skipDelay = delay
  }
}
