import * as React from 'react'
import { Div, type PrimitiveProps, type PrimitiveElement } from '@reference-ui/react'
import {
  adjustLayoutByDelta,
  calculateSeparatorAriaValues,
  layoutNumbersEqual,
  validateLayout,
  validatePanelConstraints,
  type PanelConstraints,
} from './splitter-math'

export type SplitterOrientation = 'horizontal' | 'vertical'

// Shipped resize floor: panels clamp to >= 5% unless the author sets minSize.
// Quarantine defaults this floor to 0; 5 preserves the current branch behavior.
const DEFAULT_PANEL_MIN_SIZE = 5
const DEFAULT_PANEL_MAX_SIZE = 100

const globalProcess = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process

function warnSplitter(message: string) {
  if (globalProcess?.env?.NODE_ENV === 'production') return
  console.error(`[Reference UI Splitter] ${message}`)
}

// Collect per-Panel resize constraints from the element tree. Descends through
// fragments/wrappers but stops at nested Splitter roots (they own their Panels)
// and never descends into Panel content. Missing indices fall back to defaults,
// so an unrecognized tree behaves exactly as before.
function collectPanelConstraints(children: React.ReactNode): Map<number, PanelConstraints> {
  const found = new Map<number, PanelConstraints>()
  const visit = (node: React.ReactNode): void => {
    React.Children.forEach(node, (child) => {
      if (!React.isValidElement(child)) return
      const type = child.type as unknown
      if (type === SplitterPanel) {
        const props = child.props as SplitterPanelProps
        found.set(props.index ?? 0, {
          minSize: props.minSize ?? DEFAULT_PANEL_MIN_SIZE,
          maxSize: props.maxSize ?? DEFAULT_PANEL_MAX_SIZE,
          collapsible: props.collapsible,
          collapsedSize: props.collapsedSize ?? 0,
        })
        return
      }
      if (type === Splitter) return
      const props = child.props as { children?: React.ReactNode } | undefined
      if (props && typeof type !== 'string') visit(props.children)
    })
  }
  visit(children)
  return found
}

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
  panelConstraints: PanelConstraints[]
  adjustHandle: (handleIndex: number, deltaPercent: number) => void
  resizeFromOrigin: (
    handleIndex: number,
    originLayout: number[],
    deltaPercent: number,
    isFinal?: boolean
  ) => void
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

  const {
    orientation,
    value,
    disabled: groupDisabled,
    panelConstraints,
    adjustHandle,
    resizeFromOrigin,
  } = context
  const isDisabled = disabledProp ?? groupDisabled
  const separatorAria = calculateSeparatorAriaValues({
    layout: value,
    panelConstraints,
    panelIndex: index,
  })
  const isHorizontal = orientation === 'horizontal'

  const [isDragging, setIsDragging] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)
  const [isFocused, setIsFocused] = React.useState(false)
  const handleRef = React.useRef<HTMLDivElement>(null)
  const dragStartRef = React.useRef<{
    pointerPos: number
    containerSize: number
    originLayout: number[]
  } | null>(null)

  React.useEffect(() => {
    if (!isDragging) return

    const handleWindowPointerMove = (e: PointerEvent) => {
      if (!dragStartRef.current || isDisabled) return

      const { pointerPos, containerSize, originLayout } = dragStartRef.current
      const currentPos = isHorizontal ? e.clientX : e.clientY
      const deltaPixels = currentPos - pointerPos
      const deltaPercent = (deltaPixels / containerSize) * 100

      resizeFromOrigin(index, originLayout, deltaPercent, false)
    }

    const handleWindowPointerUp = (e: PointerEvent) => {
      if (dragStartRef.current) {
        const { pointerPos, containerSize, originLayout } = dragStartRef.current
        const currentPos = isHorizontal ? e.clientX : e.clientY
        const deltaPixels = currentPos - pointerPos
        const deltaPercent = (deltaPixels / containerSize) * 100

        resizeFromOrigin(index, originLayout, deltaPercent, true)
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
  }, [isDragging, isDisabled, isHorizontal, index, resizeFromOrigin])

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
      adjustHandle(index, -(value[index] ?? 50))
    } else if (e.key === 'End') {
      e.preventDefault()
      adjustHandle(index, value[index + 1] ?? 50)
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
      originLayout: [...value],
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(e)
    if (!dragStartRef.current || isDisabled) return

    const { pointerPos, containerSize, originLayout } = dragStartRef.current
    const currentPos = isHorizontal ? e.clientX : e.clientY
    const deltaPixels = currentPos - pointerPos
    const deltaPercent = (deltaPixels / containerSize) * 100

    resizeFromOrigin(index, originLayout, deltaPercent, false)
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerUp?.(e)
    if (dragStartRef.current) {
      const { pointerPos, containerSize, originLayout } = dragStartRef.current
      const currentPos = isHorizontal ? e.clientX : e.clientY
      const deltaPixels = currentPos - pointerPos
      const deltaPercent = (deltaPixels / containerSize) * 100

      resizeFromOrigin(index, originLayout, deltaPercent, true)
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
        aria-valuenow={Math.round(separatorAria.valueNow)}
        aria-valuemin={separatorAria.valueMin}
        aria-valuemax={separatorAria.valueMax}
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

    const collectedConstraints = collectPanelConstraints(children)
    const panelConstraints: PanelConstraints[] = value.map(
      (_, panelIndex) =>
        collectedConstraints.get(panelIndex) ?? {
          minSize: DEFAULT_PANEL_MIN_SIZE,
          maxSize: DEFAULT_PANEL_MAX_SIZE,
        }
    )

    if (globalProcess?.env?.NODE_ENV !== 'production') {
      const layoutCheck = validateLayout(
        value,
        collectedConstraints.size > 0 ? collectedConstraints.size : undefined
      )
      if (!layoutCheck.valid && layoutCheck.error) warnSplitter(layoutCheck.error)
      const constraintCheck = validatePanelConstraints(
        panelConstraints.map((c) => ({
          min: c.minSize,
          max: c.maxSize,
          collapsible: c.collapsible,
          collapsedSize: c.collapsedSize,
        }))
      )
      if (!constraintCheck.valid && constraintCheck.error) warnSplitter(constraintCheck.error)
    }

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

    const commitLayout = React.useCallback(
      (nextValues: number[], isFinal: boolean) => {
        if (!isControlled) {
          setInternalValue(nextValues)
        }
        onChange?.(nextValues)
        if (isFinal) {
          onChangeEnd?.(nextValues)
        }
      },
      [isControlled, onChange, onChangeEnd]
    )

    const adjustHandle = React.useCallback(
      (handleIndex: number, deltaPercent: number) => {
        if (handleIndex < 0 || handleIndex >= value.length - 1) return

        const nextValues = adjustLayoutByDelta({
          delta: deltaPercent,
          initialLayout: value,
          panelConstraints,
          pivotIndices: [handleIndex, handleIndex + 1],
          prevLayout: value,
          trigger: 'keyboard',
        })
        // The solver returns the previous layout by reference when nothing
        // could move: an exact no-op fires no callbacks.
        if (nextValues === value) return
        commitLayout(nextValues, true)
      },
      [value, panelConstraints, commitLayout]
    )

    const resizeFromOrigin = React.useCallback(
      (handleIndex: number, originLayout: number[], deltaPercent: number, isFinal = false) => {
        if (handleIndex < 0 || handleIndex >= value.length - 1) return

        const nextValues = adjustLayoutByDelta({
          delta: deltaPercent,
          initialLayout: originLayout,
          panelConstraints,
          pivotIndices: [handleIndex, handleIndex + 1],
          prevLayout: value,
          trigger: 'mouse-or-touch',
        })
        // A zero-delta solve returns the origin copy, which is element-equal
        // but not reference-equal: compare element-wise so a press without
        // movement fires no callbacks. The final event of a session that did
        // move still closes with onChangeEnd even though the last move already
        // committed the final layout.
        const unchangedVsCurrent =
          nextValues === value ||
          (nextValues.length === value.length &&
            nextValues.every((entry, entryIndex) =>
              layoutNumbersEqual(entry, value[entryIndex] ?? 0)
            ))
        if (unchangedVsCurrent) {
          if (isFinal) {
            const sessionMoved =
              originLayout.length !== value.length ||
              originLayout.some(
                (entry, entryIndex) => !layoutNumbersEqual(entry, value[entryIndex] ?? 0)
              )
            if (sessionMoved) onChangeEnd?.(value)
          }
          return
        }
        commitLayout(nextValues, isFinal)
      },
      [value, panelConstraints, commitLayout, onChangeEnd]
    )

    const contextValue = React.useMemo<SplitterContextValue>(
      () => ({
        orientation,
        value,
        disabled,
        containerRef,
        panelConstraints,
        adjustHandle,
        resizeFromOrigin,
      }),
      [orientation, value, disabled, panelConstraints, adjustHandle, resizeFromOrigin]
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

