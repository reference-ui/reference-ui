import * as React from 'react'

export interface ReferenceLibraryProps {
  children?: React.ReactNode
  toaster?: {
    defaultPosition?: string
    defaultDuration?: number | false
    limit?: number
  }
  tooltip?: {
    skipDelay?: number
  }
}

export interface ToastItem {
  id: string
  content: React.ReactNode
  duration?: number | false
  position?: string
  createdAt: number
  remaining?: number
}

interface ToastOptions {
  id?: string
  duration?: number | false
  position?: string
  document?: Document
}

interface AnnounceOptions {
  politeness?: 'polite' | 'assertive'
  document?: Document
}

interface DocumentRuntimeStore {
  activeHostId: string | null
  subscribers: Set<() => void>
  toasts: ToastItem[]
  politeAnnouncement: string | null
  assertiveAnnouncement: string | null
  tooltipWarmUntil: number
  tooltipSkipDelay: number
}

const documentStores = new WeakMap<Document, DocumentRuntimeStore>()
const hostRegistry = new Map<string, { doc: Document; update: () => void }>()

let libraryIdCounter = 0

function getDocStore(doc?: Document): DocumentRuntimeStore {
  const targetDoc =
    doc ?? (typeof document !== 'undefined' ? document : undefined)
  if (!targetDoc) {
    return {
      activeHostId: null,
      subscribers: new Set(),
      toasts: [],
      politeAnnouncement: null,
      assertiveAnnouncement: null,
      tooltipWarmUntil: 0,
      tooltipSkipDelay: 300,
    }
  }

  let store = documentStores.get(targetDoc)
  if (!store) {
    store = {
      activeHostId: null,
      subscribers: new Set(),
      toasts: [],
      politeAnnouncement: null,
      assertiveAnnouncement: null,
      tooltipWarmUntil: 0,
      tooltipSkipDelay: 300,
    }
    documentStores.set(targetDoc, store)
  }
  return store
}

function notifyStore(store: DocumentRuntimeStore) {
  for (const sub of Array.from(store.subscribers)) {
    try {
      sub()
    } catch {
      // ignore
    }
  }
}

// Global toast internal API
export const referenceToast = {
  show(content: React.ReactNode, options: ToastOptions = {}) {
    const doc = options.document ?? (typeof document !== 'undefined' ? document : undefined)
    const store = getDocStore(doc)
    const id = options.id ?? `toast-${Date.now()}-${Math.random()}`
    const duration = options.duration ?? 5000
    const position = options.position ?? 'bottom-end'

    const existingIndex = store.toasts.findIndex(t => t.id === id)
    const item: ToastItem = {
      id,
      content,
      duration,
      position,
      createdAt: Date.now(),
      remaining: duration === false ? undefined : duration,
    }

    if (existingIndex !== -1) {
      store.toasts[existingIndex] = item
    } else {
      store.toasts.push(item)
    }

    notifyStore(store)
    return id
  },

  dismiss(id: string, options: { document?: Document } = {}) {
    const doc = options.document ?? (typeof document !== 'undefined' ? document : undefined)
    const store = getDocStore(doc)
    store.toasts = store.toasts.filter(t => t.id !== id)
    notifyStore(store)
  },

  dismissAll(options: { document?: Document } = {}) {
    const doc = options.document ?? (typeof document !== 'undefined' ? document : undefined)
    const store = getDocStore(doc)
    store.toasts = []
    notifyStore(store)
  },
}

// Global announce API
export function announce(message: string, options: AnnounceOptions = {}) {
  const doc = options.document ?? (typeof document !== 'undefined' ? document : undefined)
  const store = getDocStore(doc)
  const politeness = options.politeness ?? 'polite'

  if (politeness === 'assertive') {
    store.assertiveAnnouncement = message
  } else {
    store.politeAnnouncement = message
  }

  notifyStore(store)
}

// Tooltip warmup manager
export const tooltipWarmup = {
  isWarmed(doc?: Document): boolean {
    const store = getDocStore(doc)
    return Date.now() < store.tooltipWarmUntil
  },
  warm(doc?: Document) {
    const store = getDocStore(doc)
    store.tooltipWarmUntil = Date.now() + (store.tooltipSkipDelay || 300)
  },
  reset(doc?: Document) {
    const store = getDocStore(doc)
    store.tooltipWarmUntil = 0
  },
}

export function ReferenceLibrary({
  children,
  toaster,
  tooltip,
}: ReferenceLibraryProps) {
  const hostIdRef = React.useRef<string | null>(null)
  if (!hostIdRef.current) {
    hostIdRef.current = `ref-lib-${++libraryIdCounter}`
  }
  const hostId = hostIdRef.current

  const [, forceUpdate] = React.useReducer(x => x + 1, 0)
  const store = typeof document !== 'undefined' ? getDocStore(document) : null

  React.useLayoutEffect(() => {
    if (typeof document === 'undefined') return

    const doc = document
    const s = getDocStore(doc)

    if (tooltip?.skipDelay !== undefined) {
      s.tooltipSkipDelay = tooltip.skipDelay
    }

    hostRegistry.set(hostId, {
      doc,
      update: () => {
        forceUpdate()
      },
    })

    // Election: if no active host in this document, claim active host
    if (s.activeHostId === null) {
      s.activeHostId = hostId
    }

    // Notify all registered hosts to sync election state
    for (const [, entry] of hostRegistry.entries()) {
      if (entry.doc === doc) {
        entry.update()
      }
    }

    const onStoreChange = () => {
      forceUpdate()
    }
    s.subscribers.add(onStoreChange)

    return () => {
      s.subscribers.delete(onStoreChange)
      hostRegistry.delete(hostId)

      // If active host is unmounting, elect next standby host in this document
      if (s.activeHostId === hostId) {
        s.activeHostId = null
        for (const [id, entry] of hostRegistry.entries()) {
          if (entry.doc === doc) {
            s.activeHostId = id
            entry.update()
            break
          }
        }
      }
    }
  }, [hostId, tooltip?.skipDelay])

  const isActiveHost = store?.activeHostId === hostId

  return (
    <>
      {children}

      {/* Only the elected active host in this document renders runtime roots */}
      {isActiveHost && store && (
        <>
          {/* Toast Host */}
          <div
            data-reference-toast-host=""
            style={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              pointerEvents: 'none',
            }}
          >
            {store.toasts.slice(0, toaster?.limit ?? 4).map(t => (
              <div
                key={t.id}
                data-toast-id={t.id}
                style={{
                  pointerEvents: 'auto',
                  padding: '8px 16px',
                  background: '#222',
                  color: '#fff',
                  borderRadius: 4,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}
              >
                {t.content}
              </div>
            ))}
          </div>

          {/* Live Regions */}
          <div
            style={{
              position: 'absolute',
              width: 1,
              height: 1,
              padding: 0,
              margin: -1,
              overflow: 'hidden',
              clip: 'rect(0, 0, 0, 0)',
              whiteSpace: 'nowrap',
              border: 0,
            }}
          >
            <div role="status" aria-live="polite" data-testid="polite-announcer">
              {store.politeAnnouncement}
            </div>
            <div role="alert" aria-live="assertive" data-testid="assertive-announcer">
              {store.assertiveAnnouncement}
            </div>
          </div>
        </>
      )}
    </>
  )
}
