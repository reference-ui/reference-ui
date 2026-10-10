/**
 * Earliest-live host election across every ReferenceLibrary mount in a document.
 * Each mount registers its host id with its owner document; the first live
 * registration wins and later mounts stand by, and when the winner unmounts
 * ownership fails over to the next live mount in the same document without
 * resetting document-scoped runtime state. `registerHost` seats a mount and
 * repairs a stale election, `unregisterHost` drops it and elects a successor,
 * and `subscribeHost` wakes a mount when a sibling's arrival or departure may
 * have changed the outcome. Documents never share an election: the stores hang
 * off `globalThis` in a WeakMap keyed by Document so iframe documents and the
 * top document each elect their own host, and server renders without a DOM get
 * an ephemeral store that can never win.
 */
export interface ReferenceLibraryStore {
  activeHostId: string | null
  subscribers: Set<() => void>
}

export interface HostEntry {
  doc: Document
  update: () => void
}

const LIBRARY_STORES_KEY = '__referenceLibraryStores__'
const hostRegistry = new Map<string, HostEntry>()

function getLibraryStores(): WeakMap<Document, ReferenceLibraryStore> {
  const g = globalThis as typeof globalThis & {
    [LIBRARY_STORES_KEY]?: WeakMap<Document, ReferenceLibraryStore>
  }
  if (!g[LIBRARY_STORES_KEY]) {
    g[LIBRARY_STORES_KEY] = new WeakMap()
  }
  return g[LIBRARY_STORES_KEY]
}

export function getLibraryStore(doc?: Document): ReferenceLibraryStore {
  const targetDoc = doc ?? (typeof document !== 'undefined' ? document : undefined)
  if (!targetDoc) {
    return { activeHostId: null, subscribers: new Set() }
  }

  const stores = getLibraryStores()
  let store = stores.get(targetDoc)
  if (!store) {
    store = { activeHostId: null, subscribers: new Set() }
    stores.set(targetDoc, store)
  }
  return store
}

export function registerHost(hostId: string, doc: Document, update: () => void): ReferenceLibraryStore {
  const store = getLibraryStore(doc)
  hostRegistry.set(hostId, { doc, update })

  if (store.activeHostId === null || !hostRegistry.has(store.activeHostId)) {
    store.activeHostId = hostId
  }

  for (const [, entry] of hostRegistry.entries()) {
    if (entry.doc === doc) {
      entry.update()
    }
  }
  return store
}

export function unregisterHost(hostId: string, doc: Document): void {
  hostRegistry.delete(hostId)
  const store = getLibraryStore(doc)

  if (store.activeHostId === hostId) {
    store.activeHostId = null
    for (const [id, entry] of hostRegistry.entries()) {
      if (entry.doc === doc) {
        store.activeHostId = id
        entry.update()
        break
      }
    }
  }
}

export function subscribeHost(store: ReferenceLibraryStore, listener: () => void): () => void {
  store.subscribers.add(listener)
  return () => {
    store.subscribers.delete(listener)
  }
}
