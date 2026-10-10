/**
 * Splitter.Handle: the focusable separator between two panels. It registers
 * with the nearest root, reads its frozen-while-dragging separator ARIA and
 * blocked flag from the separator model, and forwards pointer and keyboard
 * gestures to the root sessions — consumer handlers observe first. Blocked
 * handles stay focusable but inert, and publish their state for Thumb chrome.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import { SplitterContext, SplitterHandleContext } from '../context'
import type { SplitterHandleContextValue, SplitterHandleProps } from '../types'
import { useComposedRef, useIsomorphicLayoutEffect } from '../shared/refs'
import { useSettledHover } from '../hooks/use-settled-hover'
import { SplitterThumb } from './Thumb'

export const SplitterHandle = React.forwardRef<HTMLDivElement, SplitterHandleProps>(function SplitterHandle(
  {
    disabled = false,
    withThumb = true,
    children,
    className,
    style,
    onKeyDown,
    onKeyUp,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onPointerEnter,
    onPointerLeave,
    onFocus,
    onBlur,
    ...props
  }: SplitterHandleProps,
  forwardedRef
) {
  const context = React.useContext(SplitterContext)
  if (!context) return null

  const { orientation, isResizing, resizingHandleIndex } = context
  const isDisabled = disabled
  const isHorizontal = orientation === 'horizontal'

  // Pin the first render's key: the React 17 CT shim mints a fresh useId
  // per render, and DOM-order registration keys off this value.
  const autoHandleKey = React.useId().replace(/:/g, '')
  const [handleKey] = React.useState(autoHandleKey)
  const handleIndex = context.getHandleIndex(handleKey)
  const separatorAria = context.getSeparatorAria(handleIndex)
  // FEATURES #7 (focusable-but-inert): explicit `disabled` and computed
  // infeasibility both block action; neither removes the tab stop.
  const isBlocked = context.isHandleBlocked(handleIndex, disabled)
  const primaryPanelId = context.getPanelId(context.primaryPanelIndex(handleIndex))
  const isDragging = isResizing && resizingHandleIndex === handleIndex

  const [isHovered, setIsHovered] = React.useState(false)
  const [isFocused, setIsFocused] = React.useState(false)
  const handleRef = React.useRef<HTMLDivElement | null>(null)
  const composedHandleRef = useComposedRef(handleRef, forwardedRef)

  const registerHandle = context.registerHandle
  useIsomorphicLayoutEffect(() => {
    if (!registerHandle) return
    return registerHandle({ key: handleKey, element: handleRef.current, disabled })
  }, [registerHandle, handleKey, disabled])

  const cancelOwnedSession = context.cancelOwnedSession
  const cancelKeyboardSession = context.cancelKeyboardSession
  React.useEffect(() => {
    if (isDisabled) cancelOwnedSession(handleIndex)
    return () => cancelOwnedSession(handleIndex)
  }, [isDisabled, cancelOwnedSession, handleIndex])

  useSettledHover(handleRef, isDragging, setIsHovered)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || isBlocked) return
    context.onHandleKeyDown(handleIndex, e)
  }

  const handleKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyUp?.(e)
    if (e.defaultPrevented) return
    context.onHandleKeyUp()
  }

  const handlePointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerEnter?.(e)
    if (!isDisabled) {
      setIsHovered(true)
    }
  }

  const handlePointerLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(e)
    if (!isDragging) {
      setIsHovered(false)
    }
  }

  const handleFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    onFocus?.(e)
    // Focusable-but-inert: a blocked Handle still shows focus — keyboard
    // users must see where they are. Only action is gated.
    setIsFocused(true)
  }

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    onBlur?.(e)
    setIsFocused(false)
    cancelKeyboardSession(handleIndex)
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(e)
    if (e.defaultPrevented || isBlocked) return
    context.onHandlePointerDown(handleIndex, e)
  }

  // Consumer-only: the Root session owns moves, release, and cancel.
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(e)
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerUp?.(e)
  }

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerCancel?.(e)
  }

  const handleContextValue = React.useMemo<SplitterHandleContextValue>(
    () => ({
      orientation,
      isDragging,
      isHovered,
      isFocused,
      isDisabled,
    }),
    [orientation, isDragging, isHovered, isFocused, isDisabled]
  )

  const lineColor = isDragging ? 'ui.focus.ring' : 'ui.table.border'

  const hasAuthoredThumb = React.Children.toArray(children).some(
    (child) =>
      React.isValidElement(child) &&
      (child.type === SplitterThumb || (child.type as any)?.displayName === 'SplitterThumb')
  )

  const hasChildren = children != null && children !== false

  const isLineHighlighted = isHovered || isDragging || isFocused

  const renderContent = () => {
    if (hasChildren && !hasAuthoredThumb) {
      return children
    }

    return (
      <>
        <Div
          data-reference-splitter-handle-line=""
          pointerEvents="none"
          style={{
            width: isHorizontal ? 1 : '100%',
            height: isHorizontal ? '100%' : 1,
            backgroundColor: isLineHighlighted
              ? 'var(--colors-ui-focus-ring, var(--colors-gray-400))'
              : 'var(--colors-ui-table-border, var(--colors-gray-800, #374151))',
            transition: 'background-color 150ms ease',
          }}
        />
        {withThumb && (hasAuthoredThumb ? children : <SplitterThumb />)}
      </>
    )
  }

  // B-28: strip the deleted `index` prop so stale call sites can't leak
  // it onto the DOM. Still a type error by design (see SP-TYPE-01).
  const { index: _handleIndex, ...rest } = props as typeof props & { index?: unknown }
  void _handleIndex

  return (
    <SplitterHandleContext.Provider value={handleContextValue}>
      <Div
        ref={composedHandleRef}
        role="separator"
        tabIndex={0}
        aria-valuenow={Math.round(separatorAria.valueNow)}
        aria-valuemin={separatorAria.valueMin}
        aria-valuemax={separatorAria.valueMax}
        aria-controls={primaryPanelId || undefined}
        aria-disabled={isBlocked ? true : undefined}
        aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
        data-reference-splitter-handle=""
        data-orientation={orientation}
        data-disabled={isDisabled ? '' : undefined}
        data-state={isDragging ? 'active' : isHovered ? 'hover' : 'idle'}
        data-hover={isHovered ? '' : undefined}
        data-resizing={isDragging ? '' : undefined}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        flex="0 0 auto"
        display="flex"
        flexDirection={isHorizontal ? 'column' : 'row'}
        alignItems="center"
        justifyContent="center"
        position="relative"
        width={isHorizontal ? '9px' : '100%'}
        height={isHorizontal ? '100%' : '9px'}
        margin={isHorizontal ? '0 -4px' : '-4px 0'}
        zIndex={1}
        bg="transparent"
        cursor={isBlocked ? 'default' : isHorizontal ? 'col-resize' : 'row-resize'}
        touchAction="none"
        userSelect="none"
        outline="none"
        _focusVisible={{ outline: '2px solid', outlineColor: 'ui.focus.ring', outlineOffset: '1px' }}
        className={className}
        style={style}
        {...rest}
      >
        {renderContent()}
      </Div>
    </SplitterHandleContext.Provider>
  )
})
