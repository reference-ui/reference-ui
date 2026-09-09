import * as React from 'react'
import { Div } from '@reference-ui/react'
import { useStore } from 'zustand'
import { overlayStackStore } from '../Overlay/stack'
import {
  DEFAULT_TOAST_HOTKEY,
  defaultSwipeDirections,
  isAllowedSwipe,
  isToastPausedByOverlay,
  LIBRARY_TOAST_DURATION,
  LIBRARY_TOAST_LIMIT,
  LIBRARY_TOAST_POSITION,
  matchesHotkey,
  remainingAfterElapsed,
  shouldAutoDismiss,
  shouldDismissSwipe,
  TOAST_HISTORY_LIMIT,
  visibleToasts,
} from './toastQueue'

export type ToastDismissReason = 'auto' | 'manual'

export interface ToastHistoryRecord {
  id: string
  type?: string
  position?: string
  createdAt: number
  updatedAt: number
  dismissedAt?: number
}

export interface ToastItem {
  id: string
  content: React.ReactNode | ((id: string) => React.ReactNode)
  duration?: number | false
  position?: string
  createdAt: number
  remaining?: number | false
  dismissible: boolean
  onAutoClose?: (id: string) => void
  onDismiss?: (id: string) => void
  type?: string
  testId?: string
  invert?: boolean
  richColors?: boolean
  swipeDirections?: readonly string[]
}

export interface ReferenceToastOptions {
  id?: string
  duration?: number | false
  position?: string
  document?: Document
  dismissible?: boolean
  onAutoClose?: (id: string) => void
  onDismiss?: (id: string) => void
  type?: string
  testId?: string
  invert?: boolean
  richColors?: boolean
  swipeDirections?: readonly string[]
}

interface ToastRuntimeDefaults {
  duration: number | false
  position: string
  limit: number
}

interface ToastRuntimeStore {
  subscribers: Set<() => void>
  toasts: ToastItem[]
  history: ToastHistoryRecord[]
  defaults: ToastRuntimeDefaults
}

const TOAST_RUNTIME_KEY = '__referenceToastRuntime__'

function createToastStore(): ToastRuntimeStore {
  return {
    subscribers: new Set(),
    toasts: [],
    history: [],
    defaults: {
      duration: LIBRARY_TOAST_DURATION,
      position: LIBRARY_TOAST_POSITION,
      limit: LIBRARY_TOAST_LIMIT,
    },
  }
}

export function getToastStore(doc?: Document): ToastRuntimeStore {
  const targetDoc = doc ?? (typeof document !== 'undefined' ? document : undefined)
  if (!targetDoc) {
    return createToastStore()
  }

  const holder = targetDoc as Document & { [TOAST_RUNTIME_KEY]?: ToastRuntimeStore }
  let store = holder[TOAST_RUNTIME_KEY]
  if (!store) {
    store = createToastStore()
    holder[TOAST_RUNTIME_KEY] = store
  }
  return store
}

export function setToastDefaults(
  defaults: Partial<ToastRuntimeDefaults>,
  doc?: Document
): void {
  const store = getToastStore(doc)
  store.defaults = { ...store.defaults, ...defaults }
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

function rememberHistory(store: ToastRuntimeStore, item: ToastItem, dismissedAt?: number) {
  const existing = store.history.find(record => record.id === item.id && !record.dismissedAt)
  if (existing) {
    existing.type = item.type
    existing.position = item.position
    existing.updatedAt = Date.now()
    if (dismissedAt) existing.dismissedAt = dismissedAt
  } else {
    store.history.push({
      id: item.id,
      type: item.type,
      position: item.position,
      createdAt: item.createdAt,
      updatedAt: Date.now(),
      dismissedAt,
    })
  }
  if (store.history.length > TOAST_HISTORY_LIMIT) {
    store.history.splice(0, store.history.length - TOAST_HISTORY_LIMIT)
  }
}

export function snapshotToasts(store: ToastRuntimeStore): ToastHistoryRecord[] {
  return store.toasts.map(item => ({
    id: item.id,
    type: item.type,
    position: item.position,
    createdAt: item.createdAt,
    updatedAt: item.createdAt,
  }))
}

export const referenceToast = {
  show(content: React.ReactNode | ((id: string) => React.ReactNode), options: ReferenceToastOptions = {}) {
    const doc = options.document ?? (typeof document !== 'undefined' ? document : undefined)
    const store = getToastStore(doc)
    const id = options.id ?? `toast-${Date.now()}-${Math.random()}`
    const duration = options.duration ?? store.defaults.duration
    const position = options.position ?? store.defaults.position
    const dismissible = options.dismissible ?? true

    const existingIndex = store.toasts.findIndex(t => t.id === id)
    const item: ToastItem = {
      id,
      content,
      duration,
      position,
      createdAt: Date.now(),
      remaining: duration === false ? false : duration,
      dismissible,
      onAutoClose: options.onAutoClose,
      onDismiss: options.onDismiss,
      type: options.type,
      testId: options.testId,
      invert: options.invert,
      richColors: options.richColors,
      swipeDirections: options.swipeDirections,
    }

    if (existingIndex !== -1) {
      const previous = store.toasts[existingIndex]!
      const durationChanged = previous.duration !== duration
      store.toasts[existingIndex] = {
        ...item,
        onAutoClose: options.onAutoClose ?? previous.onAutoClose,
        onDismiss: options.onDismiss ?? previous.onDismiss,
        type: options.type ?? previous.type,
        testId: options.testId ?? previous.testId,
        invert: options.invert ?? previous.invert,
        richColors: options.richColors ?? previous.richColors,
        swipeDirections: options.swipeDirections ?? previous.swipeDirections,
        remaining: durationChanged ? item.remaining : previous.remaining,
        createdAt: durationChanged ? item.createdAt : previous.createdAt,
      }
      rememberHistory(store, store.toasts[existingIndex]!)
    } else {
      store.toasts.push(item)
      rememberHistory(store, item)
    }

    notifyStore(store)
    return id
  },

  dismiss(
    id: string,
    options: { document?: Document; reason?: ToastDismissReason } = {}
  ) {
    const doc = options.document ?? (typeof document !== 'undefined' ? document : undefined)
    const store = getToastStore(doc)
    const item = store.toasts.find(t => t.id === id)
    if (!item) return
    if (options.reason === 'auto') {
      item.onAutoClose?.(id)
    } else {
      item.onDismiss?.(id)
    }
    rememberHistory(store, item, Date.now())
    store.toasts = store.toasts.filter(t => t.id !== id)
    notifyStore(store)
  },

  dismissAll(options: { document?: Document } = {}) {
    const doc = options.document ?? (typeof document !== 'undefined' ? document : undefined)
    const store = getToastStore(doc)
    const now = Date.now()
    for (const item of store.toasts) {
      item.onDismiss?.(item.id)
      rememberHistory(store, item, now)
    }
    store.toasts = []
    notifyStore(store)
  },

  getToasts(doc?: Document): ToastHistoryRecord[] {
    return snapshotToasts(getToastStore(doc))
  },

  getHistory(doc?: Document): ToastHistoryRecord[] {
    return getToastStore(doc).history.map(record => ({ ...record }))
  },
}

export const ToastItemContext = React.createContext<{
  id?: string
  dismissible?: boolean
  closeButton?: boolean
  icons?: ToastIcons
  richColors?: boolean
  invert?: boolean
}>({})

export interface ToastIcons {
  success?: React.ReactNode
  info?: React.ReactNode
  warning?: React.ReactNode
  error?: React.ReactNode
  loading?: React.ReactNode
  close?: React.ReactNode
}

export type ToastOffset =
  | number
  | string
  | {
      top?: string | number
      right?: string | number
      bottom?: string | number
      left?: string | number
    }

function cssOffset(value: string | number | undefined, fallback: string): string {
  if (value == null) return fallback
  return typeof value === 'number' ? `${value}px` : value
}

function resolveEdgeOffset(offset: ToastOffset | undefined, edge: 'top' | 'right' | 'bottom' | 'left'): string {
  if (offset == null) return '16px'
  if (typeof offset === 'number' || typeof offset === 'string') return cssOffset(offset, '16px')
  return cssOffset(offset[edge], '16px')
}

function getPositionStyles(position: string, offset?: ToastOffset): React.CSSProperties {
  const top = resolveEdgeOffset(offset, 'top')
  const right = resolveEdgeOffset(offset, 'right')
  const bottom = resolveEdgeOffset(offset, 'bottom')
  const left = resolveEdgeOffset(offset, 'left')
  switch (position) {
    case 'top-start':
      return { top, left, alignItems: 'flex-start' }
    case 'top-center':
      return { top, left: '50%', transform: 'translateX(-50%)', alignItems: 'center' }
    case 'top-end':
      return { top, right, alignItems: 'flex-end' }
    case 'bottom-start':
      return { bottom, left, alignItems: 'flex-start' }
    case 'bottom-center':
      return { bottom, left: '50%', transform: 'translateX(-50%)', alignItems: 'center' }
    case 'bottom-end':
    default:
      return { bottom, right, alignItems: 'flex-end' }
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
  closeButton?: boolean
  icons?: ToastIcons
  richColors?: boolean
  invert?: boolean
  swipeDirections?: readonly Array<'top' | 'right' | 'bottom' | 'left'>
  onHeight: (id: string, height: number) => void
  onDismiss: (id: string, reason: ToastDismissReason) => void
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
  closeButton,
  icons,
  richColors,
  invert,
  swipeDirections,
  onHeight,
  onDismiss,
  onDragStateChange,
}: ToastItemWrapperProps) {
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = React.useState(false)
  const dragStartRef = React.useRef<{ x: number; y: number } | null>(null)
  const dragStartTimeRef = React.useRef<number | null>(null)
  const swipeAxisRef = React.useRef<'x' | 'y' | null>(null)
  const previousFocusRef = React.useRef<HTMLElement | null>(null)
  const ref = React.useRef<HTMLDivElement>(null)
  const swipeLocked = item.type === 'loading' || !item.dismissible
  const allowedSwipe = item.swipeDirections?.length
    ? (item.swipeDirections as Array<'top' | 'right' | 'bottom' | 'left'>)
    : swipeDirections?.length
      ? swipeDirections
      : defaultSwipeDirections(item.position ?? LIBRARY_TOAST_POSITION)

  const duration = item.duration ?? LIBRARY_TOAST_DURATION
  const prevDurationRef = React.useRef(duration)
  const [remainingTime, setRemainingTime] = React.useState<number | false>(
    item.remaining ?? duration
  )
  const lastResumeTime = React.useRef<number | null>(null)
  const [isFocused, setIsFocused] = React.useState(false)
  const [isHidden, setIsHidden] = React.useState(
    () => (typeof document !== 'undefined' ? document.visibilityState === 'hidden' : false)
  )
  const ownerDoc = typeof document !== 'undefined' ? document : null
  const isolatingOverlay = useStore(overlayStackStore, s =>
    isToastPausedByOverlay(s.layers, ownerDoc)
  )

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

  const isPaused = isExpanded || isFocused || isHidden || isolatingOverlay || isDragging

  React.useEffect(() => {
    if (remainingTime === false) return

    if (isPaused) {
      if (lastResumeTime.current !== null) {
        const elapsed = Date.now() - lastResumeTime.current
        setRemainingTime(prev => remainingAfterElapsed(prev, elapsed) as number | false)
        lastResumeTime.current = null
      }
      return
    }

    if (shouldAutoDismiss(remainingTime)) {
      onDismiss(item.id, 'auto')
      return
    }

    lastResumeTime.current = Date.now()
    const timer = setTimeout(() => {
      onDismiss(item.id, 'auto')
    }, remainingTime)

    return () => {
      clearTimeout(timer)
      if (lastResumeTime.current !== null) {
        const elapsed = Date.now() - lastResumeTime.current
        setRemainingTime(prev => remainingAfterElapsed(prev, elapsed) as number | false)
        lastResumeTime.current = null
      }
    }
  }, [isPaused, remainingTime, item.id, onDismiss])

  React.useEffect(() => {
    return () => {
      const active = typeof document !== 'undefined' ? document.activeElement : null
      const previous = previousFocusRef.current
      if (ref.current && active && ref.current.contains(active) && previous?.isConnected) {
        previous.focus()
      }
    }
  }, [])

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (swipeLocked) return
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.closest('button, a, input, textarea, select, [contenteditable="true"]')) return

    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // ignore
    }
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    dragStartTimeRef.current = Date.now()
    swipeAxisRef.current = null
    setIsDragging(true)
    onDragStateChange(true)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current) return
    const xDelta = e.clientX - dragStartRef.current.x
    const yDelta = e.clientY - dragStartRef.current.y
    if (!swipeAxisRef.current && (Math.abs(xDelta) > 1 || Math.abs(yDelta) > 1)) {
      swipeAxisRef.current = Math.abs(xDelta) > Math.abs(yDelta) ? 'x' : 'y'
    }
    if (swipeAxisRef.current === 'y') {
      setDragOffset({ x: 0, y: yDelta })
    } else {
      setDragOffset({ x: xDelta, y: 0 })
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    setIsDragging(false)
    onDragStateChange(false)
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    } catch {
      // ignore
    }

    const axis = swipeAxisRef.current ?? 'x'
    const amount = axis === 'y' ? dragOffset.y : dragOffset.x
    const distance = Math.abs(amount)
    const time = dragStartTimeRef.current ? Date.now() - dragStartTimeRef.current : 1
    const velocity = distance / Math.max(1, time)
    const allowed = isAllowedSwipe(axis, amount, allowedSwipe)

    if (item.dismissible && allowed && shouldDismissSwipe(distance, velocity)) {
      const exit = axis === 'y' ? { x: 0, y: amount > 0 ? 280 : -280 } : { x: amount > 0 ? 350 : -350, y: 0 }
      setDragOffset(exit)
      setTimeout(() => onDismiss(item.id, 'manual'), 120)
    } else {
      setDragOffset({ x: 0, y: 0 })
    }
    dragStartRef.current = null
    dragStartTimeRef.current = null
    swipeAxisRef.current = null
  }

  const isFront = frontOffset === 0
  const stackedY = isTop ? frontOffset * 14 : -frontOffset * 14
  const expandedY = isTop ? expandedOffset : -expandedOffset
  const y = isExpanded ? expandedY : stackedY
  const scale = isExpanded ? 1 : Math.max(0.85, 1 - frontOffset * 0.05)
  const zIndex = totalCount - frontOffset
  const opacity = frontOffset > 2 && !isExpanded ? 0 : 1 - Math.max(Math.abs(dragOffset.x), Math.abs(dragOffset.y)) / 300
  const transformOrigin = isTop ? 'top center' : 'bottom center'

  const transform = `translate3d(${dragOffset.x}px, ${y + dragOffset.y}px, 0px) scale(${scale})`
  const content = typeof item.content === 'function' ? item.content(item.id) : item.content
  const itemRichColors = item.richColors ?? richColors
  const itemInvert = item.invert ?? invert

  return (
    <Div
      ref={ref}
      data-reference-toast-id={item.id}
      data-toast-id={item.id}
      data-reference-toast-position={item.position ?? LIBRARY_TOAST_POSITION}
      data-front={isFront ? 'true' : 'false'}
      data-state="open"
      data-paused={isPaused ? 'true' : 'false'}
      data-type={item.type}
      data-testid={item.testId}
      data-rich-colors={itemRichColors ? 'true' : undefined}
      data-invert={itemInvert ? 'true' : undefined}
      data-dismissible={item.dismissible ? 'true' : 'false'}
      tabIndex={isFront ? -1 : undefined}
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
      onFocus={e => {
        setIsFocused(true)
        const related = e.relatedTarget
        if (related instanceof HTMLElement && !e.currentTarget.contains(related)) {
          previousFocusRef.current = related
        }
      }}
      onBlur={e => {
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
        cursor: item.dismissible && !swipeLocked ? (isDragging ? 'grabbing' : 'grab') : 'default',
        outline: 'none',
        ['--reference-toast-index' as string]: `${index}`,
        ['--reference-toast-count' as string]: `${totalCount}`,
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
        <ToastItemContext.Provider
          value={{
            id: item.id,
            dismissible: item.dismissible,
            closeButton,
            icons,
            richColors: itemRichColors,
            invert: itemInvert,
          }}
        >
          {content}
        </ToastItemContext.Provider>
      </Div>
    </Div>
  )
}

function ToastPositionStack({
  position,
  toasts,
  onDismiss,
  expand = false,
  gap = 14,
  offset,
  closeButton,
  icons,
  richColors,
  invert,
  dir,
  swipeDirections,
}: {
  position: string
  toasts: ToastItem[]
  onDismiss: (id: string, reason: ToastDismissReason) => void
  expand?: boolean
  gap?: number
  offset?: ToastOffset
  closeButton?: boolean
  icons?: ToastIcons
  richColors?: boolean
  invert?: boolean
  dir?: 'rtl' | 'ltr' | 'auto'
  swipeDirections?: readonly Array<'top' | 'right' | 'bottom' | 'left'>
}) {
  const [hovered, setIsHovered] = React.useState(false)
  const isExpanded = expand || hovered
  const isInteractingRef = React.useRef(false)
  const leaveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const [heights, setHeights] = React.useState<Record<string, number>>({})
  const isTop = position.startsWith('top')
  const posStyles = getPositionStyles(position, offset)

  const handleHeight = React.useCallback((id: string, h: number) => {
    setHeights(prev => (prev[id] === h ? prev : { ...prev, [id]: h }))
  }, [])

  const handleMouseEnter = () => {
    if (expand) return
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    if (expand || isInteractingRef.current) return
    leaveTimeoutRef.current = setTimeout(() => {
      setIsHovered(false)
    }, 80)
  }

  const totalCount = toasts.length
  const GAP = gap

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
      dir={dir}
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
        ['--reference-front-height' as string]: `${frontToastHeight}px`,
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
            closeButton={closeButton}
            icons={icons}
            richColors={richColors}
            invert={invert}
            swipeDirections={swipeDirections}
            onHeight={handleHeight}
            onDismiss={onDismiss}
            onDragStateChange={dragging => {
              isInteractingRef.current = dragging
            }}
          />
        )
      })}
    </Div>
  )
}

export interface ToastHostProps {
  limit?: number
  defaultDuration?: number | false
  defaultPosition?: string
  hotkey?: readonly string[] | false
  expand?: boolean
  gap?: number
  offset?: ToastOffset
  closeButton?: boolean
  richColors?: boolean
  invert?: boolean
  dir?: 'rtl' | 'ltr' | 'auto'
  containerAriaLabel?: string
  icons?: ToastIcons
  swipeDirections?: readonly Array<'top' | 'right' | 'bottom' | 'left'>
}

export function ToastHost({
  limit = LIBRARY_TOAST_LIMIT,
  defaultDuration = LIBRARY_TOAST_DURATION,
  defaultPosition = LIBRARY_TOAST_POSITION,
  hotkey = DEFAULT_TOAST_HOTKEY,
  expand = false,
  gap = 14,
  offset,
  closeButton,
  richColors,
  invert,
  dir,
  containerAriaLabel = 'Notifications',
  icons,
  swipeDirections,
}: ToastHostProps) {
  const [, forceUpdate] = React.useReducer(x => x + 1, 0)
  const store = typeof document !== 'undefined' ? getToastStore(document) : null

  React.useLayoutEffect(() => {
    setToastDefaults({
      duration: defaultDuration,
      position: defaultPosition,
      limit,
    })
  }, [defaultDuration, defaultPosition, limit])

  React.useLayoutEffect(() => {
    if (!store) return
    const onStoreChange = () => forceUpdate()
    store.subscribers.add(onStoreChange)
    return () => {
      store.subscribers.delete(onStoreChange)
    }
  }, [store])

  const onDismiss = React.useCallback((id: string, reason: ToastDismissReason) => {
    referenceToast.dismiss(id, { reason })
  }, [])

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!matchesHotkey(e, hotkey)) return
      const host = document.querySelector('[data-reference-toast-host]') as HTMLElement | null
      if (!host) return
      const front = host.querySelector<HTMLElement>('[data-reference-toast-id][data-front="true"]')
      if (!front) return
      e.preventDefault()
      const focusable = front.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      ;(focusable ?? front).focus()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [hotkey])

  const toasts = store?.toasts ?? []
  const shown = visibleToasts(toasts, limit)
  const grouped = new Map<string, ToastItem[]>()
  for (const item of shown) {
    const pos = item.position ?? LIBRARY_TOAST_POSITION
    const list = grouped.get(pos) ?? []
    list.push(item)
    grouped.set(pos, list)
  }

  if (!store) return null

  return (
    <Div
      data-reference-toast-host=""
      data-reference-overlay-ignore=""
      data-react-aria-top-layer=""
      role="region"
      aria-label={containerAriaLabel}
      pointerEvents="none"
    >
      {shown.length > 0 &&
        Array.from(grouped.entries()).map(([pos, items]) => (
          <ToastPositionStack
            key={pos}
            position={pos}
            toasts={items}
            onDismiss={onDismiss}
            expand={expand}
            gap={gap}
            offset={offset}
            closeButton={closeButton}
            icons={icons}
            richColors={richColors}
            invert={invert}
            dir={dir}
            swipeDirections={swipeDirections}
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
        [data-reference-toast-root][data-rich-colors="true"][data-type="success"] {
          background: var(--colors-green-50, #ecfdf5);
          border-color: var(--colors-green-200, #a7f3d0);
          color: var(--colors-green-950, #052e16);
        }
        [data-reference-toast-root][data-rich-colors="true"][data-type="error"] {
          background: var(--colors-red-50, #fef2f2);
          border-color: var(--colors-red-200, #fecaca);
          color: var(--colors-red-950, #450a0a);
        }
        [data-reference-toast-root][data-rich-colors="true"][data-type="warning"] {
          background: var(--colors-amber-50, #fffbeb);
          border-color: var(--colors-amber-200, #fde68a);
          color: var(--colors-amber-950, #451a03);
        }
        [data-reference-toast-root][data-rich-colors="true"][data-type="info"] {
          background: var(--colors-blue-50, #eff6ff);
          border-color: var(--colors-blue-200, #bfdbfe);
          color: var(--colors-blue-950, #172554);
        }
        [data-reference-toast-root][data-invert="true"] {
          background: var(--colors-neutral-950, #0a0a0a);
          color: var(--colors-neutral-50, #fafafa);
          border-color: var(--colors-neutral-800, #262626);
        }
        @keyframes reference-toast-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Div>
  )
}
