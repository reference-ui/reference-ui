import * as React from 'react'
import { Div } from '@reference-ui/react'

export interface ToastItem {
  id: string
  content: React.ReactNode
  duration?: number | false
  position?: string
  createdAt: number
  remaining?: number
}

export interface ReferenceToastOptions {
  id?: string
  duration?: number | false
  position?: string
  document?: Document
}

interface ToastRuntimeStore {
  subscribers: Set<() => void>
  toasts: ToastItem[]
}

const toastStores = new WeakMap<Document, ToastRuntimeStore>()

export function getToastStore(doc?: Document): ToastRuntimeStore {
  const targetDoc = doc ?? (typeof document !== 'undefined' ? document : undefined)
  if (!targetDoc) {
    return { subscribers: new Set(), toasts: [] }
  }

  let store = toastStores.get(targetDoc)
  if (!store) {
    store = { subscribers: new Set(), toasts: [] }
    toastStores.set(targetDoc, store)
  }
  return store
}

function notifyStore(store: ToastRuntimeStore) {
  for (const sub of Array.from(store.subscribers)) {
    try {
      sub()
    } catch {
      // ignore
    }
  }
}

export const referenceToast = {
  show(content: React.ReactNode, options: ReferenceToastOptions = {}) {
    const doc = options.document ?? (typeof document !== 'undefined' ? document : undefined)
    const store = getToastStore(doc)
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
    const store = getToastStore(doc)
    store.toasts = store.toasts.filter(t => t.id !== id)
    notifyStore(store)
  },

  dismissAll(options: { document?: Document } = {}) {
    const doc = options.document ?? (typeof document !== 'undefined' ? document : undefined)
    const store = getToastStore(doc)
    store.toasts = []
    notifyStore(store)
  },
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
  const dragStartTimeRef = React.useRef<number | null>(null)
  const ref = React.useRef<HTMLDivElement>(null)

  const duration = item.duration ?? 5000
  const prevDurationRef = React.useRef(duration)
  const [remainingTime, setRemainingTime] = React.useState<number | false>(
    item.remaining ?? duration
  )
  const lastResumeTime = React.useRef<number | null>(null)
  const [isFocused, setIsFocused] = React.useState(false)
  const [isHidden, setIsHidden] = React.useState(() => 
    typeof document !== 'undefined' ? document.visibilityState === 'hidden' : false
  )
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  React.useLayoutEffect(() => {
    if (ref.current) {
      const h = ref.current.getBoundingClientRect().height
      if (h > 0) {
        onHeight(item.id, h)
      }
    }
  }, [item.id, onHeight, item.content])

  React.useEffect(() => {
    if (duration !== prevDurationRef.current) {
      prevDurationRef.current = duration
      setRemainingTime(duration)
    }
  }, [duration])

  React.useEffect(() => {
    const onVisibilityChange = () => setIsHidden(document.visibilityState === 'hidden')
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  React.useEffect(() => {
    const updateModalState = () => {
      setIsModalOpen(!!document.querySelector('[data-reference-overlay-content][aria-modal="true"]'))
    }
    updateModalState()
    const observer = new MutationObserver(updateModalState)
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-modal', 'data-state'] })
    return () => observer.disconnect()
  }, [])

  const isPaused = isExpanded || isFocused || isHidden || isModalOpen || isDragging

  React.useEffect(() => {
    if (remainingTime === false) return
    
    if (isPaused) {
      if (lastResumeTime.current !== null) {
        const elapsed = Date.now() - lastResumeTime.current
        setRemainingTime(prev => (prev === false ? false : Math.max(0, prev - elapsed)))
        lastResumeTime.current = null
      }
      return
    }
    
    if (remainingTime <= 0) {
      onDismiss(item.id)
      return
    }

    lastResumeTime.current = Date.now()
    const timer = setTimeout(() => {
      onDismiss(item.id)
    }, remainingTime)
    
    return () => {
      clearTimeout(timer)
      if (lastResumeTime.current !== null) {
        const elapsed = Date.now() - lastResumeTime.current
        setRemainingTime(prev => (prev === false ? false : Math.max(0, prev - elapsed)))
        lastResumeTime.current = null
      }
    }
  }, [isPaused, remainingTime, item.id, onDismiss])

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.closest('button') || target.tagName === 'BUTTON') return

    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}
    dragStartRef.current = e.clientX
    dragStartTimeRef.current = Date.now()
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
    
    const distance = Math.abs(dragOffset)
    const time = dragStartTimeRef.current ? Date.now() - dragStartTimeRef.current : 1
    const velocity = distance / Math.max(1, time)

    if (distance > 75 || velocity > 0.5) {
      setDragOffset(dragOffset > 0 ? 350 : -350)
      setTimeout(() => onDismiss(item.id), 120)
    } else {
      setDragOffset(0)
    }
    dragStartRef.current = null
    dragStartTimeRef.current = null
  }

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
      userSelect="none"
      touchAction="pan-y"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onFocus={(e) => setIsFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsFocused(false)
        }
      }}
      style={{
        zIndex,
        opacity,
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
          opacity: 1,
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
        ['--reference-front-height' as any]: `${frontToastHeight}px`,
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

export function ToastHost({ limit = 4 }: { limit?: number }) {
  const [, forceUpdate] = React.useReducer(x => x + 1, 0)
  const store = typeof document !== 'undefined' ? getToastStore(document) : null

  React.useLayoutEffect(() => {
    if (!store) return
    const onStoreChange = () => forceUpdate()
    store.subscribers.add(onStoreChange)
    return () => {
      store.subscribers.delete(onStoreChange)
    }
  }, [store])

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 't' || e.code === 'KeyT')) {
        e.preventDefault()
        const host = document.querySelector('[data-reference-toast-host]') as HTMLElement
        if (!host) return
        
        const focusable = host.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        focusable?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!store) return null

  const visibleToasts = store.toasts.slice(0, limit)
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
      <style>{`
        [data-reference-toast-position][data-expanded="false"] [data-front="false"] [data-reference-toast-root] {
          height: var(--reference-front-height, 68px) !important;
          overflow: hidden !important;
        }
        [data-reference-toast-position][data-expanded="false"] [data-front="false"] [data-reference-toast-root] > * {
          opacity: 0 !important;
          pointer-events: none !important;
          transition: opacity 180ms ease !important;
        }
      `}</style>
    </Div>
  )
}
