import * as React from 'react'
import { setupFocusVisible } from '../../core/theme/primitives/forms/focus-visible'
import { ToastHost, type ToastClassNames, type ToastOffset, type ToastTheme } from '../Toast'
import { getTooltipGroupStore } from '../Tooltip/tooltipGroup'
import { AnnouncerHost } from '../Announcer'
import { DEFAULT_TOAST_HOTKEY } from '../Toast/toastQueue'

setupFocusVisible()

export interface ReferenceLibraryToaster {
  defaultPosition?: string
  defaultDuration?: number | false
  limit?: number
  hotkey?: string[] | false
  expand?: boolean
  gap?: number
  offset?: number | string | {
    top?: string | number
    right?: string | number
    bottom?: string | number
    left?: string | number
  }
  closeButton?: boolean
  richColors?: boolean
  invert?: boolean
  dir?: 'rtl' | 'ltr' | 'auto'
  theme?: ToastTheme
  mobileOffset?: ToastOffset
  containerAriaLabel?: string
  icons?: {
    success?: React.ReactNode
    info?: React.ReactNode
    warning?: React.ReactNode
    error?: React.ReactNode
    loading?: React.ReactNode
    close?: React.ReactNode
  }
  swipeDirections?: Array<'top' | 'right' | 'bottom' | 'left'>
  toastOptions?: {
    classNames?: ToastClassNames
    unstyled?: boolean
    className?: string
    style?: React.CSSProperties
    closeButton?: boolean
  }
}

export interface ReferenceLibraryProps {
  children?: React.ReactNode
  toaster?: ReferenceLibraryToaster
  tooltip?: {
    skipDelay?: number
  }
}

interface ReferenceLibraryStore {
  activeHostId: string | null
  subscribers: Set<() => void>
}

const LIBRARY_STORES_KEY = '__referenceLibraryStores__'
const hostRegistry = new Map<string, { doc: Document; update: () => void }>()
let libraryIdCounter = 0

function getLibraryStores(): WeakMap<Document, ReferenceLibraryStore> {
  const g = globalThis as typeof globalThis & {
    [LIBRARY_STORES_KEY]?: WeakMap<Document, ReferenceLibraryStore>
  }
  if (!g[LIBRARY_STORES_KEY]) {
    g[LIBRARY_STORES_KEY] = new WeakMap()
  }
  return g[LIBRARY_STORES_KEY]
}

function getLibraryStore(doc?: Document): ReferenceLibraryStore {
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

export function ReferenceLibrary({
  children,
  toaster,
  tooltip,
}: ReferenceLibraryProps) {
  const hostIdRef = React.useRef<string | null>(null)
  if (!hostIdRef.current) {
    libraryIdCounter += 1
    hostIdRef.current = `ref-lib-${libraryIdCounter}`
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

    if (s.activeHostId === null || !hostRegistry.has(s.activeHostId)) {
      s.activeHostId = hostId
    }

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

      {isActiveHost && (
        <>
          <ToastHost
            limit={toaster?.limit}
            defaultDuration={toaster?.defaultDuration}
            defaultPosition={toaster?.defaultPosition}
            hotkey={toaster?.hotkey ?? DEFAULT_TOAST_HOTKEY}
            expand={toaster?.expand}
            gap={toaster?.gap}
            offset={toaster?.offset}
            closeButton={toaster?.closeButton}
            richColors={toaster?.richColors}
            invert={toaster?.invert}
            theme={toaster?.theme}
            dir={toaster?.dir}
            mobileOffset={toaster?.mobileOffset}
            containerAriaLabel={toaster?.containerAriaLabel}
            icons={toaster?.icons}
            swipeDirections={toaster?.swipeDirections}
            toastOptions={toaster?.toastOptions}
          />
          <AnnouncerHost />
        </>
      )}
    </>
  )
}
