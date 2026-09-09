import * as React from 'react'
import { Div } from '@reference-ui/react'
import { useStore } from 'zustand'
import { overlayStackStore } from '../Overlay/stack'
import { usePresence } from '../Presence/Presence'
import { DefaultToast } from './ToastChrome'
import { ToastItemContext, type ToastClassNames, type ToastIcons } from './toastContext'
import { findFocusableProximity, isElementFocusable } from '../FocusLock/candidates'
import {
  getToastStore,
  referenceToast,
  registerToastDocument,
  setToastDefaults,
  unregisterToastDocument,
  type ToastDismissReason,
  type ToastItem,
} from './toastRuntime'
import { TOAST_HOST_STYLES } from './toastStyles'
import {
  DEFAULT_TOAST_HOTKEY,
  defaultSwipeDirections,
  hasTextSelection,
  isAllowedSwipe,
  isToastItemPaused,
  isToastPausedByOverlay,
  LIBRARY_TOAST_DURATION,
  LIBRARY_TOAST_LIMIT,
  LIBRARY_TOAST_POSITION,
  matchesHotkey,
  remainingAfterElapsed,
  shouldAutoDismiss,
  shouldDismissSwipe,
  swipeOffset,
  TOAST_GAP,
  TOAST_MOBILE_BREAKPOINT,
  TOAST_MOBILE_OFFSET,
  TOAST_OFFSET,
  TOAST_SCALE_STEP,
  TOAST_WIDTH,
  visibleToasts,
} from './toastQueue'

let lastOutsideFocus: HTMLElement | null = null

export type {
  ReferenceToastOptions,
  ToastDismissReason,
  ToastHistoryRecord,
  ToastItem,
} from './toastRuntime'
export { getToastStore, referenceToast, setToastDefaults, snapshotToasts } from './toastRuntime'
export { ToastItemContext } from './toastContext'
export type { ToastClassNames, ToastIcons } from './toastContext'

export type ToastOffset =
  | number
  | string
  | {
      top?: string | number
      right?: string | number
      bottom?: string | number
      left?: string | number
    }

export type ToastTheme = 'light' | 'dark' | 'system'

function cssOffset(value: string | number | undefined, fallback: string): string {
  if (value == null) return fallback
  return typeof value === 'number' ? `${value}px` : value
}

function resolveEdgeOffset(
  offset: ToastOffset | undefined,
  edge: 'top' | 'right' | 'bottom' | 'left',
  fallback: string
): string {
  if (offset == null) return fallback
  if (typeof offset === 'number' || typeof offset === 'string') return cssOffset(offset, fallback)
  return cssOffset(offset[edge], fallback)
}

function getPositionStyles(
  position: string,
  offset: ToastOffset | undefined,
  fallback: string,
  mobile: boolean
): React.CSSProperties {
  const top = resolveEdgeOffset(offset, 'top', fallback)
  const right = resolveEdgeOffset(offset, 'right', fallback)
  const bottom = resolveEdgeOffset(offset, 'bottom', fallback)
  const left = resolveEdgeOffset(offset, 'left', fallback)
  const dropCenterTranslate = mobile && (position === 'top-center' || position === 'bottom-center')
  switch (position) {
    case 'top-start':
      return { top, left, alignItems: 'flex-start' }
    case 'top-center':
      return {
        top,
        left: dropCenterTranslate ? left : '50%',
        right: dropCenterTranslate ? right : undefined,
        transform: dropCenterTranslate ? undefined : 'translateX(-50%)',
        alignItems: 'center',
      }
    case 'top-end':
      return { top, right, alignItems: 'flex-end' }
    case 'bottom-start':
      return { bottom, left, alignItems: 'flex-start' }
    case 'bottom-center':
      return {
        bottom,
        left: dropCenterTranslate ? left : '50%',
        right: dropCenterTranslate ? right : undefined,
        transform: dropCenterTranslate ? undefined : 'translateX(-50%)',
        alignItems: 'center',
      }
    case 'bottom-end':
    default:
      return { bottom, right, alignItems: 'flex-end' }
  }
}

function getPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(getPrefersReducedMotion)
  React.useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])
  return reduced
}

function useIsMobile(breakpoint = TOAST_MOBILE_BREAKPOINT) {
  const [mobile, setMobile] = React.useState(false)
  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const onChange = () => setMobile(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [breakpoint])
  return mobile
}

function resolveDir(dir?: 'rtl' | 'ltr' | 'auto'): 'ltr' | 'rtl' {
  if (dir === 'rtl' || dir === 'ltr') return dir
  if (typeof document === 'undefined') return 'ltr'
  return document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr'
}

function mergeClassNames(
  toaster?: ToastClassNames,
  toast?: ToastClassNames
): ToastClassNames | undefined {
  if (!toaster && !toast) return undefined
  return { ...toaster, ...toast }
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
  dir: 'ltr' | 'rtl'
  swipeDirections?: ReadonlyArray<'top' | 'right' | 'bottom' | 'left'>
  toasterClassNames?: ToastClassNames
  toasterUnstyled?: boolean
  toasterStyle?: React.CSSProperties
  toasterClassName?: string
  onHeight: (id: string, height: number) => void
  onDismiss: (id: string, reason: ToastDismissReason) => void
  onExited: (id: string, generation: number) => void
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
  dir,
  swipeDirections,
  toasterClassNames,
  toasterUnstyled,
  toasterStyle,
  toasterClassName,
  onHeight,
  onDismiss,
  onExited,
  onDragStateChange,
}: ToastItemWrapperProps) {
  const present = !item.exiting
  const { isPresent, ref: presenceRef } = usePresence(present)
  const reducedMotion = usePrefersReducedMotion()
  const [entered, setEntered] = React.useState(reducedMotion)
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = React.useState(false)
  const [swipeOut, setSwipeOut] = React.useState(false)
  const dragStartRef = React.useRef<{ x: number; y: number } | null>(null)
  const dragStartTimeRef = React.useRef<number | null>(null)
  const swipeAxisRef = React.useRef<'x' | 'y' | null>(null)
  const draggingRef = React.useRef(false)
  const pointerIdRef = React.useRef<number | null>(null)
  const appliedOffsetRef = React.useRef({ x: 0, y: 0 })
  const previousFocusRef = React.useRef<HTMLElement | null>(null)
  const nodeRef = React.useRef<HTMLDivElement | null>(null)
  const swipeLocked = item.type === 'loading' || !item.dismissible
  const allowedSwipe = item.swipeDirections?.length
    ? (item.swipeDirections as Array<'top' | 'right' | 'bottom' | 'left'>)
    : swipeDirections?.length
      ? swipeDirections
      : defaultSwipeDirections(item.position ?? LIBRARY_TOAST_POSITION, dir)
  const swipeMetaRef = React.useRef({
    allowedSwipe,
    dismissible: item.dismissible,
    swipeLocked,
    onDismiss,
    id: item.id,
    onDragStateChange,
  })
  swipeMetaRef.current = {
    allowedSwipe,
    dismissible: item.dismissible,
    swipeLocked,
    onDismiss,
    id: item.id,
    onDragStateChange,
  }

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

  const composedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      nodeRef.current = node
      presenceRef(node)
    },
    [presenceRef]
  )

  React.useLayoutEffect(() => {
    const node = nodeRef.current
    if (!node) return
    const measure = () => {
      const inner = node.querySelector('[data-reference-toast-root]') as HTMLElement | null
      const h = (inner ?? node).scrollHeight || (inner ?? node).getBoundingClientRect().height
      if (h > 0) onHeight(item.id, h)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(node)
    return () => ro.disconnect()
  }, [item.id, onHeight, item.content, item.title, item.description, item.action, item.cancel])

  React.useLayoutEffect(() => {
    if (reducedMotion) {
      setEntered(true)
      return
    }
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true))
    })
    return () => cancelAnimationFrame(frame)
  }, [reducedMotion])

  const handleExited = React.useCallback(() => {
    onExited(item.id, item.generation)
  }, [item.id, item.generation, onExited])

  React.useEffect(() => {
    if (!present && !isPresent) handleExited()
  }, [present, isPresent, handleExited])

  const durationResetRef = React.useRef(false)

  React.useEffect(() => {
    if (duration !== prevDurationRef.current) {
      prevDurationRef.current = duration
      durationResetRef.current = true
      setRemainingTime(duration)
    }
  }, [duration])

  React.useEffect(() => {
    const onVisibilityChange = () => setIsHidden(document.visibilityState === 'hidden')
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  const isPaused = isToastItemPaused({
    pointer: isExpanded,
    focus: isFocused,
    hidden: isHidden,
    overlay: isolatingOverlay,
    dragging: isDragging,
    exiting: Boolean(item.exiting),
  })

  React.useEffect(() => {
    if (item.exiting) return
    if (remainingTime === false) return

    if (isPaused) {
      if (lastResumeTime.current !== null) {
        const elapsed = Date.now() - lastResumeTime.current
        if (!durationResetRef.current) {
          setRemainingTime(prev => remainingAfterElapsed(prev, elapsed) as number | false)
        }
        durationResetRef.current = false
        lastResumeTime.current = null
      }
      return
    }

    if (shouldAutoDismiss(remainingTime)) {
      onDismiss(item.id, 'auto')
      return
    }

    durationResetRef.current = false
    lastResumeTime.current = Date.now()
    const timer = setTimeout(() => {
      onDismiss(item.id, 'auto')
    }, remainingTime)

    return () => {
      clearTimeout(timer)
      if (lastResumeTime.current !== null) {
        const elapsed = Date.now() - lastResumeTime.current
        if (!durationResetRef.current) {
          setRemainingTime(prev => remainingAfterElapsed(prev, elapsed) as number | false)
        }
        durationResetRef.current = false
        lastResumeTime.current = null
      }
    }
  }, [isPaused, remainingTime, item.id, item.exiting, onDismiss])

  const restoreToastFocus = React.useCallback(() => {
    if (typeof document === 'undefined') return
    const node = nodeRef.current
    const recorded = previousFocusRef.current
    const origin =
      recorded && (!node || !node.contains(recorded))
        ? recorded
        : lastOutsideFocus && (!node || !node.contains(lastOutsideFocus))
          ? lastOutsideFocus
          : recorded
    const parent = origin?.parentElement ?? null
    const next = origin?.nextElementSibling ?? null
    const prev = origin?.previousElementSibling ?? null
    if (origin && isElementFocusable(origin)) {
      origin.focus({ preventScroll: true })
      return
    }
    if (origin && next instanceof HTMLElement && isElementFocusable(next)) {
      next.focus({ preventScroll: true })
      return
    }
    findFocusableProximity(origin, parent, next, prev)?.focus({ preventScroll: true })
  }, [])

  React.useLayoutEffect(() => {
    if (present) return
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => restoreToastFocus())
    })
    return () => cancelAnimationFrame(frame)
  }, [present, restoreToastFocus])

  React.useEffect(() => {
    return () => {
      requestAnimationFrame(() => restoreToastFocus())
    }
  }, [restoreToastFocus])

  React.useLayoutEffect(() => {
    const node = nodeRef.current
    if (!node) return
    if (reducedMotion) {
      node.style.setProperty('transition', 'none', 'important')
      node.style.setProperty('animation', 'none', 'important')
    } else if (!isDragging) {
      node.style.removeProperty('transition')
      node.style.removeProperty('animation')
    }
  }, [reducedMotion, isDragging, item.id])

  const finishDrag = React.useCallback((pointerId?: number) => {
    if (!draggingRef.current) return
    draggingRef.current = false
    setIsDragging(false)
    swipeMetaRef.current.onDragStateChange(false)
    const node = nodeRef.current
    try {
      if (node && pointerId != null && node.hasPointerCapture(pointerId)) {
        node.releasePointerCapture(pointerId)
      }
    } catch {
      // ignore
    }
    pointerIdRef.current = null

    const meta = swipeMetaRef.current
    const axis = swipeAxisRef.current ?? 'x'
    const fromNodeX = node ? parseFloat(node.style.getPropertyValue('--reference-toast-swipe-x')) || 0 : 0
    const fromNodeY = node ? parseFloat(node.style.getPropertyValue('--reference-toast-swipe-y')) || 0 : 0
    const applied = appliedOffsetRef.current
    const raw = axis === 'y' ? (applied.y || fromNodeY) : (applied.x || fromNodeX)
    const distance = Math.abs(raw)
    const time = dragStartTimeRef.current ? Date.now() - dragStartTimeRef.current : 1
    const velocity = distance / Math.max(1, time)
    const allowed = isAllowedSwipe(axis, raw, meta.allowedSwipe)

    if (meta.dismissible && !meta.swipeLocked && allowed && shouldDismissSwipe(distance, velocity)) {
      const exit = axis === 'y' ? { x: 0, y: raw > 0 ? 280 : -280 } : { x: raw > 0 ? 400 : -400, y: 0 }
      setSwipeOut(true)
      setDragOffset(exit)
      node?.style.setProperty('--reference-toast-swipe-x', `${exit.x}px`)
      node?.style.setProperty('--reference-toast-swipe-y', `${exit.y}px`)
      meta.onDismiss(meta.id, 'manual')
    } else {
      setDragOffset({ x: 0, y: 0 })
      node?.style.setProperty('--reference-toast-swipe-x', '0px')
      node?.style.setProperty('--reference-toast-swipe-y', '0px')
    }
    appliedOffsetRef.current = { x: 0, y: 0 }
    dragStartRef.current = null
    dragStartTimeRef.current = null
    swipeAxisRef.current = null
  }, [])

  const applyDragDelta = React.useCallback((clientX: number, clientY: number) => {
    if (!draggingRef.current || !dragStartRef.current) return
    const xDelta = clientX - dragStartRef.current.x
    const yDelta = clientY - dragStartRef.current.y
    if (!swipeAxisRef.current && (Math.abs(xDelta) > 1 || Math.abs(yDelta) > 1)) {
      swipeAxisRef.current = Math.abs(xDelta) > Math.abs(yDelta) ? 'x' : 'y'
    }
    const axis = swipeAxisRef.current ?? 'x'
    const amount = axis === 'y' ? yDelta : xDelta
    const next = swipeOffset(axis, amount, swipeMetaRef.current.allowedSwipe)
    appliedOffsetRef.current = next
    const node = nodeRef.current
    node?.style.setProperty('--reference-toast-swipe-x', `${next.x}px`)
    node?.style.setProperty('--reference-toast-swipe-y', `${next.y}px`)
    setDragOffset(next)
  }, [])

  React.useEffect(() => {
    const onMove = (e: PointerEvent | MouseEvent) => {
      applyDragDelta(e.clientX, e.clientY)
    }
    const onUp = (e: Event) => {
      const pointerId = 'pointerId' in e ? (e as PointerEvent).pointerId : undefined
      finishDrag(pointerId)
    }
    const opts: AddEventListenerOptions = { capture: true }
    window.addEventListener('pointermove', onMove, opts)
    window.addEventListener('mousemove', onMove, opts)
    window.addEventListener('pointerup', onUp, opts)
    window.addEventListener('mouseup', onUp, opts)
    return () => {
      window.removeEventListener('pointermove', onMove, opts)
      window.removeEventListener('mousemove', onMove, opts)
      window.removeEventListener('pointerup', onUp, opts)
      window.removeEventListener('mouseup', onUp, opts)
    }
  }, [applyDragDelta, finishDrag])

  const startDrag = (clientX: number, clientY: number, pointerId: number | null, currentTarget: HTMLDivElement, target: EventTarget | null) => {
    if (swipeMetaRef.current.swipeLocked || item.exiting) return
    const el = target instanceof Element ? target : null
    if (el?.closest('[data-reference-toast-close], [data-reference-toast-action], [data-reference-toast-cancel], a, input, textarea, select, [contenteditable="true"]')) {
      return
    }
    const doc = currentTarget.ownerDocument
    const selection = doc.getSelection?.() ?? (typeof window !== 'undefined' ? window.getSelection() : null)
    if (selection && selection.toString().length > 0 && selection.anchorNode && !currentTarget.contains(selection.anchorNode)) {
      selection.removeAllRanges()
    }
    if (hasTextSelection(doc, currentTarget)) return

    draggingRef.current = true
    pointerIdRef.current = pointerId
    dragStartRef.current = { x: clientX, y: clientY }
    dragStartTimeRef.current = Date.now()
    swipeAxisRef.current = null
    appliedOffsetRef.current = { x: 0, y: 0 }
    setIsDragging(true)
    onDragStateChange(true)
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    startDrag(e.clientX, e.clientY, e.pointerId, e.currentTarget, e.target)
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    if (draggingRef.current) return
    startDrag(e.clientX, e.clientY, null, e.currentTarget, e.target)
  }

  if (!isPresent) return null

  const isFront = frontOffset === 0
  const stackedY = isTop ? frontOffset * 14 : -frontOffset * 14
  const expandedY = isTop ? expandedOffset : -expandedOffset
  const y = isExpanded ? expandedY : stackedY
  const scale = isExpanded ? 1 : Math.max(0.85, 1 - frontOffset * TOAST_SCALE_STEP)
  const zIndex = totalCount - frontOffset
  const dataState = item.exiting || !entered ? 'closed' : 'open'
  const itemRichColors = item.richColors ?? richColors
  const itemInvert = item.invert ?? invert
  const itemUnstyled = item.unstyled ?? toasterUnstyled
  const classNames = mergeClassNames(toasterClassNames, item.classNames)
  const content =
    typeof item.content === 'function'
      ? item.content(item.id)
      : item.content ?? (
          <DefaultToast
            title={item.title}
            options={{
              description: item.description,
              closeButton: item.closeButton ?? closeButton,
              type: (item.type as 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading') ?? 'default',
              action: item.action,
              cancel: item.cancel,
              icon: item.icon,
              richColors: itemRichColors,
              invert: itemInvert,
              unstyled: itemUnstyled,
              className: [toasterClassName, item.className].filter(Boolean).join(' ') || undefined,
              style: { ...toasterStyle, ...item.style },
              classNames,
            }}
          />
        )

  return (
    <div
      ref={composedRef}
      data-reference-toast-id={item.id}
      data-toast-id={item.id}
      data-reference-toast-generation={item.generation}
      data-reference-toast-position={item.position ?? LIBRARY_TOAST_POSITION}
      data-front={isFront ? 'true' : 'false'}
      data-state={dataState}
      data-exiting={item.exiting ? 'true' : undefined}
      data-y={isTop ? 'top' : 'bottom'}
      data-paused={isPaused ? 'true' : 'false'}
      data-swiping={isDragging ? 'true' : undefined}
      data-swipe-out={swipeOut ? 'true' : undefined}
      data-type={item.type}
      data-testid={item.testId}
      data-rich-colors={itemRichColors ? 'true' : undefined}
      data-invert={itemInvert ? 'true' : undefined}
      data-dismissible={item.dismissible ? 'true' : 'false'}
      tabIndex={isFront ? 0 : -1}
      onPointerDown={handlePointerDown}
      onMouseDown={handleMouseDown}
      onPointerMove={e => applyDragDelta(e.clientX, e.clientY)}
      onMouseMove={e => {
        if (e.buttons !== 1) return
        applyDragDelta(e.clientX, e.clientY)
      }}
      onPointerUp={e => finishDrag(e.pointerId)}
      onMouseUp={() => finishDrag()}
      onFocus={e => {
        setIsFocused(true)
        const related = e.relatedTarget
        if (related instanceof HTMLElement && !e.currentTarget.contains(related)) {
          previousFocusRef.current = related
        } else if (lastOutsideFocus && !e.currentTarget.contains(lastOutsideFocus)) {
          previousFocusRef.current = lastOutsideFocus
        }
      }}
      onBlur={e => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsFocused(false)
        }
      }}
      style={{
        pointerEvents: (!entered && !reducedMotion) || (frontOffset > 2 && !isExpanded) ? 'none' : 'auto',
        position: 'absolute',
        bottom: !isTop ? 0 : undefined,
        top: isTop ? 0 : undefined,
        left: 0,
        right: 0,
        touchAction: 'none',
        zIndex,
        cursor: item.dismissible && !swipeLocked ? (isDragging ? 'grabbing' : 'grab') : 'default',
        userSelect: 'none',
        transition: reducedMotion || isDragging ? 'none' : undefined,
        animation: reducedMotion ? 'none' : undefined,
        outline: isFocused ? '2px solid var(--reference-toast-focus, #171717)' : undefined,
        outlineOffset: isFocused ? '2px' : undefined,
        ['--reference-toast-index' as string]: `${index}`,
        ['--reference-toast-count' as string]: `${totalCount}`,
        ['--reference-toast-offset' as string]: `${y}px`,
        ['--reference-toast-scale' as string]: `${scale}`,
        ['--reference-toast-swipe-x' as string]: `${dragOffset.x}px`,
        ['--reference-toast-swipe-y' as string]: `${dragOffset.y}px`,
        ['--reference-toast-enter' as string]:
          dataState === 'closed' && !swipeOut ? (isTop ? '-100%' : '100%') : '0px',
        ['--reference-toast-origin' as string]: isTop ? 'top center' : 'bottom center',
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
      <ToastItemContext.Provider
        value={{
          id: item.id,
          dismissible: item.dismissible,
          closeButton: item.closeButton ?? closeButton,
          icons,
          richColors: itemRichColors,
          invert: itemInvert,
          type: item.type,
          unstyled: itemUnstyled,
          className: [toasterClassName, item.className].filter(Boolean).join(' ') || undefined,
          style: { ...toasterStyle, ...item.style },
          classNames,
          actionButtonStyle: item.actionButtonStyle,
          cancelButtonStyle: item.cancelButtonStyle,
        }}
      >
        {content}
      </ToastItemContext.Provider>
    </div>
  )
}

function ToastPositionStack({
  position,
  toasts,
  onDismiss,
  onExited,
  expand = false,
  gap = TOAST_GAP,
  offset,
  mobileOffset,
  mobile,
  closeButton,
  icons,
  richColors,
  invert,
  dir,
  swipeDirections,
  toasterClassNames,
  toasterUnstyled,
  toasterStyle,
  toasterClassName,
}: {
  position: string
  toasts: ToastItem[]
  onDismiss: (id: string, reason: ToastDismissReason) => void
  onExited: (id: string, generation: number) => void
  expand?: boolean
  gap?: number
  offset?: ToastOffset
  mobileOffset?: ToastOffset
  mobile: boolean
  closeButton?: boolean
  icons?: ToastIcons
  richColors?: boolean
  invert?: boolean
  dir: 'ltr' | 'rtl'
  swipeDirections?: ReadonlyArray<'top' | 'right' | 'bottom' | 'left'>
  toasterClassNames?: ToastClassNames
  toasterUnstyled?: boolean
  toasterStyle?: React.CSSProperties
  toasterClassName?: string
}) {
  const [hovered, setIsHovered] = React.useState(false)
  const isExpanded = expand || hovered
  const isInteractingRef = React.useRef(false)
  const leaveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const [heights, setHeights] = React.useState<Record<string, number>>({})
  const isTop = position.startsWith('top')
  const activeOffset = mobile ? (mobileOffset ?? TOAST_MOBILE_OFFSET) : (offset ?? TOAST_OFFSET)
  const fallback = mobile ? `${TOAST_MOBILE_OFFSET}px` : `${TOAST_OFFSET}px`
  const posStyles = getPositionStyles(position, activeOffset, fallback, mobile)
  const sideAligned = position.endsWith('-start') || position.endsWith('-end')

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
  }, [totalCount, toasts, heights, GAP])

  const totalExpandedHeight = React.useMemo(() => {
    let sum = 0
    for (const t of toasts) {
      sum += (heights[t.id] || 68) + GAP
    }
    return sum > 0 ? sum - GAP : 0
  }, [toasts, heights, GAP])

  const frontToastId = toasts[totalCount - 1]?.id
  const frontToastHeight = heights[frontToastId] || 68
  const collapsedHeight = frontToastHeight + (totalCount > 1 ? Math.min(totalCount - 1, 2) * 14 : 0)
  const width = mobile && sideAligned ? `calc(100vw - ${resolveEdgeOffset(activeOffset, 'left', fallback)} - ${resolveEdgeOffset(activeOffset, 'right', fallback)})` : `${TOAST_WIDTH}px`

  return (
    <Div
      dir={dir}
      data-reference-toast-position={position}
      data-expanded={isExpanded ? 'true' : 'false'}
      data-mobile={mobile ? 'true' : undefined}
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
        width,
        maxWidth: `calc(100vw - ${resolveEdgeOffset(activeOffset, 'left', fallback)} - ${resolveEdgeOffset(activeOffset, 'right', fallback)})`,
        height: isExpanded ? `${totalExpandedHeight}px` : `${collapsedHeight}px`,
        transition: 'height 400ms cubic-bezier(0.16, 1, 0.3, 1)',
        ['--reference-front-height' as string]: `${frontToastHeight}px`,
      }}
    >
      {toasts.map((item, idx) => {
        const frontOffset = totalCount - 1 - idx
        const expandedOffset = itemOffsets[idx] || 0
        return (
          <ToastItemWrapper
            key={`${item.id}:${item.generation}`}
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
            dir={dir}
            swipeDirections={swipeDirections}
            toasterClassNames={toasterClassNames}
            toasterUnstyled={toasterUnstyled}
            toasterStyle={toasterStyle}
            toasterClassName={toasterClassName}
            onHeight={handleHeight}
            onDismiss={onDismiss}
            onExited={onExited}
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
  mobileOffset?: ToastOffset
  closeButton?: boolean
  richColors?: boolean
  invert?: boolean
  theme?: ToastTheme
  dir?: 'rtl' | 'ltr' | 'auto'
  containerAriaLabel?: string
  icons?: ToastIcons
  swipeDirections?: ReadonlyArray<'top' | 'right' | 'bottom' | 'left'>
  toastOptions?: {
    classNames?: ToastClassNames
    unstyled?: boolean
    className?: string
    style?: React.CSSProperties
    closeButton?: boolean
    duration?: number | false
  }
}

export function ToastHost({
  limit = LIBRARY_TOAST_LIMIT,
  defaultDuration = LIBRARY_TOAST_DURATION,
  defaultPosition = LIBRARY_TOAST_POSITION,
  hotkey = DEFAULT_TOAST_HOTKEY,
  expand = false,
  gap = TOAST_GAP,
  offset,
  mobileOffset,
  closeButton,
  richColors,
  invert,
  theme = 'light',
  dir,
  containerAriaLabel = 'Notifications',
  icons,
  swipeDirections,
  toastOptions,
}: ToastHostProps) {
  const [, forceUpdate] = React.useReducer(x => x + 1, 0)
  const store = typeof document !== 'undefined' ? getToastStore(document) : null
  const mobile = useIsMobile()
  const reducedMotion = usePrefersReducedMotion()
  const resolvedDir = resolveDir(dir)
  const resolvedClose = closeButton ?? toastOptions?.closeButton ?? false

  React.useLayoutEffect(() => {
    setToastDefaults({
      duration: defaultDuration,
      position: defaultPosition,
      limit,
    })
  }, [defaultDuration, defaultPosition, limit])

  React.useLayoutEffect(() => {
    if (typeof document === 'undefined') return
    registerToastDocument(document)
    return () => unregisterToastDocument(document)
  }, [])

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

  const onExited = React.useCallback((id: string, generation: number) => {
    referenceToast.remove(id, { generation })
  }, [])

  React.useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const host = document.querySelector('[data-reference-toast-host]')
      const target = e.target
      if (target instanceof HTMLElement && host && !host.contains(target)) {
        lastOutsideFocus = target
      }
    }
    document.addEventListener('focusin', handleFocusIn, true)
    return () => document.removeEventListener('focusin', handleFocusIn, true)
  }, [])

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!matchesHotkey(e, hotkey)) return
      const host = document.querySelector('[data-reference-toast-host]') as HTMLElement | null
      if (!host) return
      const front = host.querySelector<HTMLElement>('[data-reference-toast-id][data-front="true"]')
      if (!front) return
      e.preventDefault()
      const active = document.activeElement
      if (active instanceof HTMLElement && !front.contains(active)) {
        lastOutsideFocus = active
      }
      try {
        front.focus({ preventScroll: true, focusVisible: true } as FocusOptions)
      } catch {
        front.focus({ preventScroll: true })
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [hotkey])

  const toasts = store?.toasts ?? []
  const active = toasts.filter(item => !item.exiting)
  const shownActive = visibleToasts(active, limit)
  const shownIds = new Set(shownActive.map(item => item.id))
  const shown = toasts.filter(item => shownIds.has(item.id) || item.exiting)
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
      data-theme={theme}
      data-reduced-motion={reducedMotion ? 'true' : undefined}
      dir={resolvedDir}
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
            onExited={onExited}
            expand={expand}
            gap={gap}
            offset={offset}
            mobileOffset={mobileOffset}
            mobile={mobile}
            closeButton={resolvedClose}
            icons={icons}
            richColors={richColors}
            invert={invert}
            dir={resolvedDir}
            swipeDirections={swipeDirections}
            toasterClassNames={toastOptions?.classNames}
            toasterUnstyled={toastOptions?.unstyled}
            toasterStyle={toastOptions?.style}
            toasterClassName={toastOptions?.className}
          />
        ))}
      <style>{TOAST_HOST_STYLES}</style>
    </Div>
  )
}
