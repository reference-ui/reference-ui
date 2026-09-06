import * as React from 'react'
import { Div, type PrimitiveProps, type PrimitiveElement } from '@reference-ui/react'
import { setupFocusVisible } from '../../core/theme/primitives/forms/focus-visible'

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

export interface ToastItem {
  id: string
  content: React.ReactNode
  duration?: number | false
  position?: string
  createdAt: number
  remaining?: number
}

interface ReferenceToastOptions {
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
  show(content: React.ReactNode, options: ReferenceToastOptions = {}) {
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
    setupFocusVisible(doc)
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
          <ToastHost toasts={store.toasts} limit={toaster?.limit} />

          {/* Live Regions */}
          <Div
            position="absolute"
            width="1px"
            height="1px"
            p="0"
            m="-1px"
            overflow="hidden"
            clip="rect(0, 0, 0, 0)"
            whiteSpace="nowrap"
            border="0"
          >
            <Div role="status" aria-live="polite" data-testid="polite-announcer">
              {store.politeAnnouncement}
            </Div>
            <Div role="alert" aria-live="assertive" data-testid="assertive-announcer">
              {store.assertiveAnnouncement}
            </Div>
          </Div>
        </>
      )}
    </>
  )
}

export const ToastItemContext = React.createContext<{ id?: string }>({})

function getPositionStyles(position: string): React.CSSProperties {
  switch (position) {
    case 'top-start':
      return { top: '16px', left: '16px', alignItems: 'flex-start' }
    case 'top-center':
      return { top: '16px', left: '50%', transform: 'translateX(-50%)', alignItems: 'center' }
    case 'top-end':
      return { top: '16px', right: '16px', alignItems: 'flex-end' }
    case 'bottom-start':
      return { bottom: '16px', left: '16px', alignItems: 'flex-start' }
    case 'bottom-center':
      return { bottom: '16px', left: '50%', transform: 'translateX(-50%)', alignItems: 'center' }
    case 'bottom-end':
    default:
      return { bottom: '16px', right: '16px', alignItems: 'flex-end' }
  }
}

interface ToastItemWrapperProps {
  item: ToastItem
  index: number
  frontOffset: number
  expandedOffset: number
  totalCount: number
  isExpanded: boolean
  isTop: boolean
  onHeight: (id: string, height: number) => void
  onDismiss: (id: string) => void
  onDragStateChange: (dragging: boolean) => void
}

function ToastItemWrapper({
  item,
  index,
  frontOffset,
  expandedOffset,
  totalCount,
  isExpanded,
  isTop,
  onHeight,
  onDismiss,
  onDragStateChange,
}: ToastItemWrapperProps) {
  const [dragOffset, setDragOffset] = React.useState(0)
  const [isDragging, setIsDragging] = React.useState(false)
  const dragStartRef = React.useRef<number | null>(null)
  const ref = React.useRef<HTMLDivElement>(null)

  // Report height for dynamic expanded stacking
  React.useLayoutEffect(() => {
    if (ref.current) {
      const h = ref.current.getBoundingClientRect().height
      if (h > 0) {
        onHeight(item.id, h)
      }
    }
  }, [item.id, onHeight])

  // Auto-dismiss timer with pause on hover
  React.useEffect(() => {
    if (item.duration === false || isExpanded) return
    const timer = setTimeout(() => {
      onDismiss(item.id)
    }, item.duration ?? 5000)
    return () => clearTimeout(timer)
  }, [item.id, item.duration, isExpanded, onDismiss])

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    // Do not initiate drag when clicking buttons/interactive elements inside toast
    if (target.closest('button') || target.tagName === 'BUTTON') return

    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}
    dragStartRef.current = e.clientX
    setIsDragging(true)
    onDragStateChange(true)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || dragStartRef.current === null) return
    const delta = e.clientX - dragStartRef.current
    setDragOffset(delta)
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    setIsDragging(false)
    onDragStateChange(false)
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    } catch {}
    if (Math.abs(dragOffset) > 75) {
      setDragOffset(dragOffset > 0 ? 350 : -350)
      setTimeout(() => onDismiss(item.id), 120)
    } else {
      setDragOffset(0)
    }
    dragStartRef.current = null
  }

  // Sonner card deck math
  // frontOffset: 0 for the newest front toast, 1 for the one behind it, etc.
  const isFront = frontOffset === 0
  const stackedY = isTop ? frontOffset * 14 : -frontOffset * 14
  const expandedY = isTop ? expandedOffset : -expandedOffset
  const y = isExpanded ? expandedY : stackedY
  const scale = isExpanded ? 1 : Math.max(0.85, 1 - frontOffset * 0.05)
  const zIndex = totalCount - frontOffset
  const opacity = frontOffset > 2 && !isExpanded ? 0 : 1 - Math.abs(dragOffset) / 300
  const transformOrigin = isTop ? 'top center' : 'bottom center'

  const transform = `translate3d(${dragOffset}px, ${y}px, 0px) scale(${scale})`

  return (
    <Div
      ref={ref}
      data-reference-toast-id={item.id}
      data-toast-id={item.id}
      data-reference-toast-position={item.position ?? 'bottom-end'}
      data-front={isFront ? 'true' : 'false'}
      data-state="open"
      pointerEvents={frontOffset > 2 && !isExpanded ? 'none' : 'auto'}
      position="absolute"
      bottom={!isTop ? 0 : undefined}
      top={isTop ? 0 : undefined}
      left={0}
      right={0}
      zIndex={zIndex}
      opacity={opacity}
      userSelect="none"
      touchAction="pan-y"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        transform,
        transformOrigin,
        transition: isDragging
          ? 'none'
          : 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease',
        cursor: isDragging ? 'grabbing' : 'grab',
        ['--reference-toast-index' as any]: `${index}`,
        ['--reference-toast-count' as any]: `${totalCount}`,
      }}
    >
      {/* Invisible gap bridge when expanded to prevent flicker when pointer travels between cards */}
      {isExpanded && frontOffset > 0 && (
        <div
          data-reference-toast-bridge=""
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '16px',
            [isTop ? 'bottom' : 'top']: '100%',
            pointerEvents: 'auto',
          }}
        />
      )}
      <Div
        style={{
          opacity: isExpanded || isFront ? 1 : 0,
          transition: 'opacity 180ms ease',
          pointerEvents: isExpanded || isFront ? 'auto' : 'none',
        }}
      >
        <ToastItemContext.Provider value={{ id: item.id }}>
          {item.content}
        </ToastItemContext.Provider>
      </Div>
    </Div>
  )
}

function ToastPositionStack({
  position,
  toasts,
  onDismiss,
}: {
  position: string
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const isInteractingRef = React.useRef(false)
  const leaveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const [heights, setHeights] = React.useState<Record<string, number>>({})
  const isTop = position.startsWith('top')
  const posStyles = getPositionStyles(position)

  const handleHeight = React.useCallback((id: string, h: number) => {
    setHeights(prev => (prev[id] === h ? prev : { ...prev, [id]: h }))
  }, [])

  const handleMouseEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }
    setIsExpanded(true)
  }

  const handleMouseLeave = () => {
    if (isInteractingRef.current) return
    leaveTimeoutRef.current = setTimeout(() => {
      setIsExpanded(false)
    }, 80)
  }

  const totalCount = toasts.length
  const GAP = 12

  // Calculate offsets for expanded state:
  // Front toast is at index totalCount - 1 (newest).
  const itemOffsets = React.useMemo(() => {
    const offsets: number[] = new Array(totalCount).fill(0)
    let accumulated = 0
    for (let f = 0; f < totalCount; f++) {
      const actualIdx = totalCount - 1 - f
      offsets[actualIdx] = accumulated
      const h = heights[toasts[actualIdx]?.id] || 68
      accumulated += h + GAP
    }
    return offsets
  }, [totalCount, toasts, heights])

  const totalExpandedHeight = React.useMemo(() => {
    let sum = 0
    for (const t of toasts) {
      sum += (heights[t.id] || 68) + GAP
    }
    return sum > 0 ? sum - GAP : 0
  }, [toasts, heights])

  const frontToastId = toasts[totalCount - 1]?.id
  const frontToastHeight = heights[frontToastId] || 68
  const collapsedHeight = frontToastHeight + (totalCount > 1 ? Math.min(totalCount - 1, 2) * 14 : 0)

  return (
    <Div
      data-reference-toast-position={position}
      data-expanded={isExpanded ? 'true' : 'false'}
      position="fixed"
      zIndex={9999}
      pointerEvents="auto"
      onPointerEnter={handleMouseEnter}
      onPointerLeave={handleMouseLeave}
      onPointerDown={() => {
        isInteractingRef.current = true
      }}
      onPointerUp={() => {
        isInteractingRef.current = false
      }}
      style={{
        ...posStyles,
        width: '356px',
        maxWidth: 'calc(100vw - 32px)',
        height: isExpanded ? `${totalExpandedHeight}px` : `${collapsedHeight}px`,
        transition: 'height 260ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {toasts.map((item, idx) => {
        const frontOffset = totalCount - 1 - idx
        const expandedOffset = itemOffsets[idx] || 0
        return (
          <ToastItemWrapper
            key={item.id}
            item={item}
            index={idx}
            frontOffset={frontOffset}
            expandedOffset={expandedOffset}
            totalCount={totalCount}
            isExpanded={isExpanded}
            isTop={isTop}
            onHeight={handleHeight}
            onDismiss={onDismiss}
            onDragStateChange={(dragging) => {
              isInteractingRef.current = dragging
            }}
          />
        )
      })}
    </Div>
  )
}

function ToastHost({
  toasts,
  limit = 4,
}: {
  toasts: ToastItem[]
  limit?: number
}) {
  const visibleToasts = toasts.slice(0, limit)
  const grouped = React.useMemo(() => {
    const map = new Map<string, ToastItem[]>()
    for (const item of visibleToasts) {
      const pos = item.position ?? 'bottom-end'
      const list = map.get(pos) ?? []
      list.push(item)
      map.set(pos, list)
    }
    return map
  }, [visibleToasts])

  return (
    <Div
      data-reference-toast-host=""
      data-reference-overlay-ignore=""
      data-react-aria-top-layer=""
      pointerEvents="none"
    >
      {visibleToasts.length > 0 &&
        Array.from(grouped.entries()).map(([pos, items]) => (
          <ToastPositionStack
            key={pos}
            position={pos}
            toasts={items}
            onDismiss={(id) => referenceToast.dismiss(id)}
          />
        ))}
    </Div>
  )
}
