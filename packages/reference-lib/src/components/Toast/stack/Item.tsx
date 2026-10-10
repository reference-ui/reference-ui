/**
 * Toast stack item: one absolutely-positioned card inside a position
 * pile. Composes presence, the enter transition, swipe, auto-dismiss,
 * focus restore, and height measuring, then renders the card's chrome
 * (custom content or the default card) inside the item context it
 * provides. Geometry folds into the shared item-style presentation.
 */
import * as React from 'react'
import { usePresence } from '../../Presence/Presence'
import { DefaultToast } from '../parts/Default'
import { ToastItemContext } from '../context'
import { mergeClassNames } from '../shared/class-names'
import { LIBRARY_TOAST_POSITION } from '../toastQueue'
import {
  useAutoDismiss,
  useFocusRestore,
  useItemHeight,
  usePrefersReducedMotion,
  useSwipe,
} from '../hooks'
import { toastItemStyle } from './item-style'
import type { ToastClassNames, ToastDismissReason, ToastIcons, ToastItem as ToastItemRecord } from '../types'

interface ToastStackItemProps {
  item: ToastItemRecord
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

export function ToastStackItem({
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
}: ToastStackItemProps) {
  const present = !item.exiting
  const { isPresent, ref: presenceRef } = usePresence(present)
  const reducedMotion = usePrefersReducedMotion()
  const [entered, setEntered] = React.useState(reducedMotion)
  const [isFocused, setIsFocused] = React.useState(false)
  const nodeRef = React.useRef<HTMLDivElement | null>(null)
  const swipeLocked = item.type === 'loading' || !item.dismissible

  const {
    dragOffset,
    isDragging,
    swipeOut,
    handlePointerDown,
    handleMouseDown,
    applyDragDelta,
    finishDrag,
  } = useSwipe({
    nodeRef,
    id: item.id,
    position: item.position,
    exiting: item.exiting,
    dismissible: item.dismissible,
    swipeLocked,
    itemSwipeDirections: item.swipeDirections,
    hostSwipeDirections: swipeDirections,
    dir,
    onDismiss,
    onDragStateChange,
  })

  const { paused: isPaused } = useAutoDismiss({
    id: item.id,
    exiting: item.exiting,
    duration: item.duration,
    initialRemaining: item.remaining,
    paused: {
      pointer: isExpanded,
      focus: isFocused,
      dragging: isDragging,
      exiting: Boolean(item.exiting),
    },
    onDismiss,
  })

  const { recordFocusEntry } = useFocusRestore({ nodeRef, present })
  useItemHeight({ nodeRef, item, onHeight })

  const composedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      nodeRef.current = node
      presenceRef(node)
    },
    [presenceRef]
  )

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

  if (!isPresent) return null

  const isFront = frontOffset === 0
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
        recordFocusEntry(e.currentTarget, e.relatedTarget)
      }}
      onBlur={e => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsFocused(false)
        }
      }}
      style={toastItemStyle({
        index,
        totalCount,
        frontOffset,
        expandedOffset,
        isExpanded,
        isTop,
        entered,
        reducedMotion,
        isDragging,
        isFocused,
        dragOffset,
        dataState,
        swipeOut,
        dismissible: item.dismissible,
        swipeLocked,
      })}
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
