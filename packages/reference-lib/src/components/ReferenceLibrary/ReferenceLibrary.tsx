import * as React from 'react'
import { setupFocusVisible } from '../../core/theme/primitives/forms/focus-visible'
import { ToastHost } from '../Toast'
import { getTooltipGroupStore } from '../Tooltip/tooltipGroup'
import { AnnouncerHost } from '../Announcer'

setupFocusVisible()

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

interface ReferenceLibraryStore {
  activeHostId: string | null
  subscribers: Set<() => void>
}

const libraryStores = new WeakMap<Document, ReferenceLibraryStore>()
const hostRegistry = new Map<string, { doc: Document; update: () => void }>()

let libraryIdCounter = 0

function getLibraryStore(doc?: Document): ReferenceLibraryStore {
  const targetDoc = doc ?? (typeof document !== 'undefined' ? document : undefined)
  if (!targetDoc) {
    return { activeHostId: null, subscribers: new Set() }
  }

  let store = libraryStores.get(targetDoc)
  if (!store) {
    store = { activeHostId: null, subscribers: new Set() }
    libraryStores.set(targetDoc, store)
  }
  return store
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
  const store = typeof document !== 'undefined' ? getLibraryStore(document) : null

  React.useLayoutEffect(() => {
    if (typeof document === 'undefined') return

    const doc = document
    setupFocusVisible(doc)
    const s = getLibraryStore(doc)

    if (tooltip?.skipDelay !== undefined) {
      getTooltipGroupStore(doc).getState().setSkipDelay(tooltip.skipDelay)
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

    const onStoreChange = () => forceUpdate()
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
      {isActiveHost && (
        <>
          <ToastHost limit={toaster?.limit} />
          <AnnouncerHost />
        </>
      )}
    </>
  )
}
