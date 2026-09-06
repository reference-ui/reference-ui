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

export type SplitterHandleProps = PrimitiveProps<'div'> & {
  index?: number
  disabled?: boolean
}

export function SplitterHandle({
  index = 0,
  disabled: disabledProp,
  className,
  style,
  onKeyDown,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  ...props
}: SplitterHandleProps) {
  const context = React.useContext(SplitterContext)
  if (!context) return null

  const { orientation, value, disabled: groupDisabled, adjustHandle, setHandleSizes } = context
  const isDisabled = disabledProp ?? groupDisabled
  const currentVal = value[index] ?? 50
  const isHorizontal = orientation === 'horizontal'

  const [isDragging, setIsDragging] = React.useState(false)
  const dragStartRef = React.useRef<{
    pointerPos: number
    containerSize: number
    startLeft: number
    startRight: number
  } | null>(null)

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
    if (!dragStartRef.current) return
    const { pointerPos, containerSize, startLeft, startRight } = dragStartRef.current
    const currentPos = isHorizontal ? e.clientX : e.clientY
    const deltaPixels = currentPos - pointerPos
    const deltaPercent = (deltaPixels / containerSize) * 100

    const total = startLeft + startRight
    let nextLeft = Math.max(5, Math.min(total - 5, startLeft + deltaPercent))
    let nextRight = total - nextLeft

    dragStartRef.current = null
    setIsDragging(false)
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    } catch {}

    setHandleSizes(index, nextLeft, nextRight, true)
  }

  return (
    <Div
      role="separator"
      tabIndex={isDisabled ? -1 : 0}
      aria-valuenow={Math.round(currentVal)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-orientation={orientation}
      data-reference-splitter-handle=""
      data-disabled={isDisabled ? '' : undefined}
      data-state={isDragging ? 'active' : 'idle'}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      flex="0 0 auto"
      display="flex"
      alignItems="center"
      justifyContent="center"
      position="relative"
      width={isHorizontal ? '2r' : '100%'}
      height={isHorizontal ? '100%' : '2r'}
      bg="transparent"
      cursor={isDisabled ? 'default' : isHorizontal ? 'col-resize' : 'row-resize'}
      touchAction="none"
      userSelect="none"
      outline="none"
      _hover={{
        bg: 'rgba(255, 255, 255, 0.06)',
      }}
      _focusVisible={{ outline: '2px solid', outlineColor: 'ui.focus.ring', outlineOffset: '1px' }}
      className={className}
      style={style}
      {...props}
    >
      <Div
        width={isHorizontal ? '1px' : '100%'}
        height={isHorizontal ? '100%' : '1px'}
        bg={isDragging ? 'ui.focus.ring' : 'ui.table.border'}
        transition="background-color 150ms ease"
        pointerEvents="none"
      />
    </Div>
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
}

Splitter.Panel = SplitterPanel
Splitter.Handle = SplitterHandle
