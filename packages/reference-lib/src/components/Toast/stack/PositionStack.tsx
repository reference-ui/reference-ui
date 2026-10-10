/**
 * Toast position stack: the fixed-position pile for one screen slot.
 * Hovers open to measured heights and settles shut to a peeking pile,
 * reporting each card's measured height upward and holding expansion
 * while any card drags. Width spans the viewport for side-aligned
 * mobile slots and fixes to the card width everywhere else.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import { ToastStackItem } from './Item'
import { getPositionStyles, resolveEdgeOffset } from './position'
import { TOAST_MOBILE_OFFSET, TOAST_OFFSET } from '../toastQueue'
import {
  collapsedStackHeight,
  expandedItemOffsets,
  expandedTotalHeight,
  stackWidth,
  TOAST_ESTIMATED_HEIGHT,
} from './layout'
import { TOAST_GAP } from '../toastQueue'
import { useStackExpand } from '../hooks'
import type { ToastClassNames, ToastDismissReason, ToastIcons, ToastItem, ToastOffset } from '../types'

export function ToastPositionStack({
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
  const { isExpanded, handleMouseEnter, handleMouseLeave, setInteracting } = useStackExpand({ expand })
  const [heights, setHeights] = React.useState<Record<string, number>>({})
  const isTop = position.startsWith('top')
  const activeOffset = mobile ? (mobileOffset ?? TOAST_MOBILE_OFFSET) : (offset ?? TOAST_OFFSET)
  const fallback = mobile ? `${TOAST_MOBILE_OFFSET}px` : `${TOAST_OFFSET}px`
  const posStyles = getPositionStyles(position, activeOffset, fallback, mobile)
  const sideAligned = position.endsWith('-start') || position.endsWith('-end')

  const handleHeight = React.useCallback((id: string, h: number) => {
    setHeights(prev => (prev[id] === h ? prev : { ...prev, [id]: h }))
  }, [])

  const totalCount = toasts.length

  const itemOffsets = React.useMemo(
    () => expandedItemOffsets(toasts, heights, gap),
    [toasts, heights, gap]
  )

  const totalExpandedHeight = React.useMemo(
    () => expandedTotalHeight(toasts, heights, gap),
    [toasts, heights, gap]
  )

  const frontToastId = toasts[totalCount - 1]?.id
  const frontToastHeight = heights[frontToastId] || TOAST_ESTIMATED_HEIGHT
  const collapsedHeight = collapsedStackHeight(frontToastHeight, totalCount)
  const width = stackWidth({ mobile, sideAligned, activeOffset, fallback })

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
        setInteracting(true)
      }}
      onPointerUp={() => {
        setInteracting(false)
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
          <ToastStackItem
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
            onDragStateChange={setInteracting}
          />
        )
      })}
    </Div>
  )
}
