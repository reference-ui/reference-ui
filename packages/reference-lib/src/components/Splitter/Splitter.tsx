import * as React from 'react'
import { Div, type PrimitiveProps, type PrimitiveElement } from '@reference-ui/react'

export type SplitterOrientation = 'horizontal' | 'vertical'

export type SplitterProps = Omit<PrimitiveProps<'div'>, 'onChange' | 'defaultValue'> & {
  orientation?: SplitterOrientation
  value?: number[]
  defaultValue?: number[]
  onChange?: (value: number[]) => void
  onChangeEnd?: (value: number[]) => void
  disabled?: boolean
}

interface SplitterContextValue {
  orientation: SplitterOrientation
  value: number[]
  disabled: boolean
  containerRef: React.RefObject<HTMLDivElement | null>
  adjustHandle: (handleIndex: number, deltaPercent: number) => void
  setHandleSizes: (handleIndex: number, nextLeft: number, nextRight: number, isFinal?: boolean) => void
}

const SplitterContext = React.createContext<SplitterContextValue | null>(null)

export type SplitterPanelProps = PrimitiveProps<'div'> & {
  index?: number
  collapsible?: boolean
  collapsedSize?: number
  minSize?: number
  maxSize?: number
}

export function SplitterPanel({
  children,
  index = 0,
  className,
  style,
  ...props
}: SplitterPanelProps) {
  const context = React.useContext(SplitterContext)
  const orientation = context?.orientation ?? 'horizontal'
  const size = context?.value[index] ?? 50

  return (
    <Div
      data-reference-splitter-panel=""
      flex={`0 0 ${size}%`}
      minWidth={orientation === 'horizontal' ? 0 : undefined}
      minHeight={orientation === 'vertical' ? 0 : undefined}
      overflow="auto"
      className={className}
      style={{
        flexBasis: `${size}%`,
        ...style,
      }}
      {...props}
    >
      {children}
    </Div>
  )
}

export interface SplitterHandleContextValue {
  orientation: SplitterOrientation
  isDragging: boolean
  isHovered: boolean
  isFocused: boolean
  isDisabled: boolean
}

export const SplitterHandleContext = React.createContext<SplitterHandleContextValue | null>(null)

export type SplitterThumbProps = PrimitiveProps<'div'> & {
  dots?: number
  dotHoverColor?: string
  dotActiveColor?: string
}

export function SplitterThumb({
  dots = 3,
  dotHoverColor,
  dotActiveColor,
  className,
  style,
  children,
  ...props
}: SplitterThumbProps) {
  const handleContext = React.useContext(SplitterHandleContext)
  const rootContext = React.useContext(SplitterContext)
  const orientation = handleContext?.orientation ?? rootContext?.orientation ?? 'horizontal'
  const isHorizontal = orientation === 'horizontal'
  const isDragging = handleContext?.isDragging ?? false
  const isHovered = handleContext?.isHovered ?? false
  const isFocused = handleContext?.isFocused ?? false
  const isDisabled = handleContext?.isDisabled ?? false

  const isHighlighted = isDragging || isHovered || isFocused

  const dotSize = 3
  const dotGap = 3
  const padding = 4
  const computedLength = Math.max(22, dots * dotSize + (dots - 1) * dotGap + padding * 2)

  return (
    <Div
      data-reference-splitter-thumb=""
      data-orientation={orientation}
      data-state={isDragging ? 'active' : isHovered ? 'hover' : 'idle'}
      data-disabled={isDisabled ? '' : undefined}
      display="flex"
      flexDirection={isHorizontal ? 'column' : 'row'}
      alignItems="center"
      justifyContent="center"
      gap={`${dotGap}px`}
      position="absolute"
      top="50%"
      left="50%"
      bg="ui.field.background"
      boxSizing="border-box"
      pointerEvents="none"
      transition="opacity 150ms ease, border-color 150ms ease"
      style={{
        transform: 'translate(-50%, -50%)',
        width: isHorizontal ? 10 : computedLength,
        height: isHorizontal ? computedLength : 10,
        borderRadius: 9999,
        border: '1px solid var(--colors-ui-table-border, var(--colors-gray-700, #4b5563))',
        opacity: isHighlighted ? 1 : 0,
        backgroundColor: 'var(--colors-ui-field-background, var(--colors-gray-900, #111827))',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
        ...style,
      }}
      className={className}
      {...props}
    >
      {children ??
        Array.from({ length: dots }).map((_, i) => (
          <Div
            key={i}
            data-reference-splitter-thumb-dot=""
            data-state={isDragging ? 'active' : isHovered ? 'hover' : 'idle'}
            pointerEvents="none"
            style={{
              width: dotSize,
              height: dotSize,
              borderRadius: 9999,
              backgroundColor: isDragging
                ? (dotActiveColor ?? 'var(--colors-ui-focus-ring, var(--colors-gray-200))')
                : (dotHoverColor ?? 'var(--colors-gray-400, #9ca3af)'),
              transition: 'background-color 150ms ease',
            }}
          />
        ))}
    </Div>
  )
}
SplitterThumb.displayName = 'SplitterThumb'

export type SplitterHandleProps = PrimitiveProps<'div'> & {
  index?: number
  disabled?: boolean
  withThumb?: boolean
}

export function SplitterHandle({
  index = 0,
  disabled: disabledProp,
  withThumb = true,
  children,
  className,
  style,
  onKeyDown,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  ...props
}: SplitterHandleProps) {
  const context = React.useContext(SplitterContext)
  if (!context) return null

  const { orientation, value, disabled: groupDisabled, adjustHandle, setHandleSizes } = context
  const isDisabled = disabledProp ?? groupDisabled
  const currentVal = value[index] ?? 50
  const isHorizontal = orientation === 'horizontal'

  const [isDragging, setIsDragging] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)
  const [isFocused, setIsFocused] = React.useState(false)
  const handleRef = React.useRef<HTMLDivElement>(null)
  const dragStartRef = React.useRef<{
    pointerPos: number
    containerSize: number
    startLeft: number
    startRight: number
  } | null>(null)

  React.useEffect(() => {
    if (!isDragging) return

    const handleWindowPointerMove = (e: PointerEvent) => {
      if (!dragStartRef.current || isDisabled) return

      const { pointerPos, containerSize, startLeft, startRight } = dragStartRef.current
      const currentPos = isHorizontal ? e.clientX : e.clientY
      const deltaPixels = currentPos - pointerPos
      const deltaPercent = (deltaPixels / containerSize) * 100

      const total = startLeft + startRight
      let nextLeft = Math.max(5, Math.min(total - 5, startLeft + deltaPercent))
      let nextRight = total - nextLeft

      setHandleSizes(index, nextLeft, nextRight, false)
    }

    const handleWindowPointerUp = (e: PointerEvent) => {
      if (dragStartRef.current) {
        const { pointerPos, containerSize, startLeft, startRight } = dragStartRef.current
        const currentPos = isHorizontal ? e.clientX : e.clientY
        const deltaPixels = currentPos - pointerPos
        const deltaPercent = (deltaPixels / containerSize) * 100

        const total = startLeft + startRight
        let nextLeft = Math.max(5, Math.min(total - 5, startLeft + deltaPercent))
        let nextRight = total - nextLeft
        setHandleSizes(index, nextLeft, nextRight, true)
      }

      dragStartRef.current = null
      setIsDragging(false)

      if (handleRef.current) {
        const rect = handleRef.current.getBoundingClientRect()
        const isInside =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        setIsHovered(isInside)
      }
    }

    window.addEventListener('pointermove', handleWindowPointerMove)
    window.addEventListener('pointerup', handleWindowPointerUp)
    window.addEventListener('pointercancel', handleWindowPointerUp)

    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove)
      window.removeEventListener('pointerup', handleWindowPointerUp)
      window.removeEventListener('pointercancel', handleWindowPointerUp)
    }
  }, [isDragging, isDisabled, isHorizontal, index, setHandleSizes])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || isDisabled) return

    const step = e.shiftKey ? 10 : 1

    if (isHorizontal) {
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        adjustHandle(index, step)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        adjustHandle(index, -step)
      }
    } else {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        adjustHandle(index, step)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        adjustHandle(index, -step)
      }
    }

    if (e.key === 'Home') {
      e.preventDefault()
      const total = (value[index] ?? 50) + (value[index + 1] ?? 50)
      setHandleSizes(index, 5, total - 5, true)
    } else if (e.key === 'End') {
      e.preventDefault()
      const total = (value[index] ?? 50) + (value[index + 1] ?? 50)
      setHandleSizes(index, total - 5, 5, true)
    }
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
    if (!isDisabled) {
      setIsFocused(true)
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    onBlur?.(e)
    setIsFocused(false)
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(e)
    if (e.defaultPrevented || isDisabled) return

    const containerEl = context.containerRef.current
    if (!containerEl) return

    const rect = containerEl.getBoundingClientRect()
    const containerSize = isHorizontal ? rect.width : rect.height
    if (containerSize <= 0) return

    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}

    setIsDragging(true)
    dragStartRef.current = {
      pointerPos: isHorizontal ? e.clientX : e.clientY,
      containerSize,
      startLeft: value[index] ?? 50,
      startRight: value[index + 1] ?? 50,
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(e)
    if (!dragStartRef.current || isDisabled) return

    const { pointerPos, containerSize, startLeft, startRight } = dragStartRef.current
    const currentPos = isHorizontal ? e.clientX : e.clientY
    const deltaPixels = currentPos - pointerPos
    const deltaPercent = (deltaPixels / containerSize) * 100

    const total = startLeft + startRight
    let nextLeft = Math.max(5, Math.min(total - 5, startLeft + deltaPercent))
    let nextRight = total - nextLeft

    setHandleSizes(index, nextLeft, nextRight, false)
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerUp?.(e)
    if (dragStartRef.current) {
      const { pointerPos, containerSize, startLeft, startRight } = dragStartRef.current
      const currentPos = isHorizontal ? e.clientX : e.clientY
      const deltaPixels = currentPos - pointerPos
      const deltaPercent = (deltaPixels / containerSize) * 100

      const total = startLeft + startRight
      let nextLeft = Math.max(5, Math.min(total - 5, startLeft + deltaPercent))
      let nextRight = total - nextLeft

      setHandleSizes(index, nextLeft, nextRight, true)
    }

    dragStartRef.current = null
    setIsDragging(false)
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    } catch {}

    if (handleRef.current) {
      const rect = handleRef.current.getBoundingClientRect()
      const isInside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      setIsHovered(isInside)
    }
  }

  const handleLostPointerCapture = () => {
    dragStartRef.current = null
    setIsDragging(false)
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

  return (
    <SplitterHandleContext.Provider value={handleContextValue}>
      <Div
        ref={handleRef}
        role="separator"
        tabIndex={isDisabled ? -1 : 0}
        aria-valuenow={Math.round(currentVal)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-orientation={orientation}
        data-reference-splitter-handle=""
        data-disabled={isDisabled ? '' : undefined}
        data-state={isDragging ? 'active' : isHovered ? 'hover' : 'idle'}
        data-hover={isHovered ? '' : undefined}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onLostPointerCapture={handleLostPointerCapture}
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
        cursor={isDisabled ? 'default' : isHorizontal ? 'col-resize' : 'row-resize'}
        touchAction="none"
        userSelect="none"
        outline="none"
        _focusVisible={{ outline: '2px solid', outlineColor: 'ui.focus.ring', outlineOffset: '1px' }}
        className={className}
        style={style}
        {...props}
      >
        {renderContent()}
      </Div>
    </SplitterHandleContext.Provider>
  )
}

export const Splitter = React.forwardRef<HTMLDivElement, SplitterProps>(
  function Splitter(
    {
      children,
      orientation = 'horizontal',
      value: valueProp,
      defaultValue = [50, 50],
      onChange,
      onChangeEnd,
      disabled = false,
      className,
      style,
      ...props
    },
    forwardedRef
  ) {
    const isControlled = valueProp !== undefined
    const [internalValue, setInternalValue] = React.useState<number[]>(defaultValue)
    const value = isControlled ? valueProp : internalValue

    const containerRef = React.useRef<HTMLDivElement | null>(null)

    const handleRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        containerRef.current = node
        if (typeof forwardedRef === 'function') {
          forwardedRef(node)
        } else if (forwardedRef) {
          ;(forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node
        }
      },
      [forwardedRef]
    )

    const adjustHandle = React.useCallback(
      (handleIndex: number, deltaPercent: number) => {
        if (handleIndex < 0 || handleIndex >= value.length - 1) return

        const leftSize = value[handleIndex]!
        const rightSize = value[handleIndex + 1]!

        let nextLeft = Math.max(5, Math.min(leftSize + rightSize - 5, leftSize + deltaPercent))
        let nextRight = leftSize + rightSize - nextLeft

        const nextValues = [...value]
        nextValues[handleIndex] = nextLeft
        nextValues[handleIndex + 1] = nextRight

        if (!isControlled) {
          setInternalValue(nextValues)
        }
        onChange?.(nextValues)
        onChangeEnd?.(nextValues)
      },
      [value, isControlled, onChange, onChangeEnd]
    )

    const setHandleSizes = React.useCallback(
      (handleIndex: number, nextLeft: number, nextRight: number, isFinal = false) => {
        if (handleIndex < 0 || handleIndex >= value.length - 1) return

        const nextValues = [...value]
        nextValues[handleIndex] = nextLeft
        nextValues[handleIndex + 1] = nextRight

        if (!isControlled) {
          setInternalValue(nextValues)
        }
        onChange?.(nextValues)
        if (isFinal) {
          onChangeEnd?.(nextValues)
        }
      },
      [value, isControlled, onChange, onChangeEnd]
    )

    const contextValue = React.useMemo<SplitterContextValue>(
      () => ({
        orientation,
        value,
        disabled,
        containerRef,
        adjustHandle,
        setHandleSizes,
      }),
      [orientation, value, disabled, adjustHandle, setHandleSizes]
    )

    return (
      <SplitterContext.Provider value={contextValue}>
        <Div
          ref={handleRef}
          data-reference-splitter=""
          data-orientation={orientation}
          data-disabled={disabled ? '' : undefined}
          display="flex"
          flexDirection={orientation === 'vertical' ? 'column' : 'row'}
          width="100%"
          height="100%"
          overflow="hidden"
          className={className}
          style={style}
          {...props}
        >
          {children}
        </Div>
      </SplitterContext.Provider>
    )
  }
) as React.ForwardRefExoticComponent<SplitterProps & React.RefAttributes<HTMLDivElement>> & {
  Panel: typeof SplitterPanel
  Handle: typeof SplitterHandle
  Thumb: typeof SplitterThumb
}

Splitter.Panel = SplitterPanel
Splitter.Handle = SplitterHandle
Splitter.Thumb = SplitterThumb

