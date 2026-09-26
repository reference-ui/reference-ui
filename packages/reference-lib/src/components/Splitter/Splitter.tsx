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
import { SPLITTER_STYLES } from './splitterStyles'

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

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect

type SplitterDirection = 'ltr' | 'rtl'

// Inherited direction for the group: nearest [dir] ancestor wins, falling back
// to the document. Read fresh at each use so mid-focus switches apply at once.
function readDirection(element: HTMLElement | null): SplitterDirection {
  const scoped = element?.closest?.('[dir]')?.getAttribute('dir')?.toLowerCase()
  if (scoped === 'rtl' || scoped === 'ltr') return scoped
  if (typeof document !== 'undefined' && document.dir?.toLowerCase() === 'rtl') return 'rtl'
  return 'ltr'
}

export type SplitterProps = Omit<PrimitiveProps<'div'>, 'onChange' | 'defaultValue'> & {
  orientation?: SplitterOrientation
  value?: number[]
  defaultValue?: number[]
  onChange?: (value: number[]) => void
  onChangeEnd?: (value: number[]) => void
  disabled?: boolean
}

export interface SplitterSeparatorAria {
  valueNow: number
  valueMin: number
  valueMax: number
}

interface SplitterContextValue {
  orientation: SplitterOrientation
  value: number[]
  disabled: boolean
  isRtl: boolean
  isResizing: boolean
  resizingHandleIndex: number | null
  panelConstraints: PanelConstraints[]
  primaryPanelIndex: (handleIndex: number) => number
  getPanelId: (panelIndex: number) => string | undefined
  registerPanel: (panelIndex: number, id: string, element: HTMLDivElement | null) => () => void
  getSeparatorAria: (handleIndex: number) => SplitterSeparatorAria
  cancelOwnedSession: (handleIndex: number) => void
  cancelKeyboardSession: (handleIndex: number) => void
  onHandlePointerDown: (handleIndex: number, e: React.PointerEvent<HTMLDivElement>) => void
  onHandleKeyDown: (handleIndex: number, e: React.KeyboardEvent<HTMLDivElement>) => void
  onHandleKeyUp: () => void
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
  id: idProp,
  collapsible = false,
  collapsedSize = 0,
  className,
  style,
  ...props
}: SplitterPanelProps) {
  const context = React.useContext(SplitterContext)
  const orientation = context?.orientation ?? 'horizontal'
  const size = context?.value[index] ?? 50

  // Pin the first render's id: the React 17 CT shim mints a fresh useId
  // per render, and the registration effect below keys off this value.
  const autoId = React.useId().replace(/:/g, '')
  const [stableAutoId] = React.useState(autoId)
  const panelId = idProp ?? `splitter-panel-${stableAutoId}`
  const panelRef = React.useRef<HTMLDivElement | null>(null)
  const registerPanel = context?.registerPanel
  useIsomorphicLayoutEffect(() => {
    if (!registerPanel) return
    return registerPanel(index, panelId, panelRef.current)
  }, [registerPanel, index, panelId])

  const isCollapsed = collapsible && layoutNumbersEqual(size, collapsedSize)

  return (
    <Div
      ref={panelRef}
      id={panelId}
      data-reference-splitter-panel=""
      data-collapsed={isCollapsed ? '' : undefined}
      data-resizing={context?.isResizing ? '' : undefined}
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
}: SplitterHandleProps) {
  const context = React.useContext(SplitterContext)
  if (!context) return null

  const { orientation, disabled: groupDisabled, isResizing, resizingHandleIndex } = context
  const isDisabled = disabledProp ?? groupDisabled
  const isHorizontal = orientation === 'horizontal'
  const separatorAria = context.getSeparatorAria(index)
  const primaryPanelId = context.getPanelId(context.primaryPanelIndex(index))
  const isDragging = isResizing && resizingHandleIndex === index

  const [isHovered, setIsHovered] = React.useState(false)
  const [isFocused, setIsFocused] = React.useState(false)
  const handleRef = React.useRef<HTMLDivElement>(null)

  const cancelOwnedSession = context.cancelOwnedSession
  const cancelKeyboardSession = context.cancelKeyboardSession
  React.useEffect(() => {
    if (isDisabled) cancelOwnedSession(index)
    return () => cancelOwnedSession(index)
  }, [isDisabled, cancelOwnedSession, index])

  // Hover may go stale while captured (leave is suppressed mid-drag), so
  // recompute it from the release position once the session settles.
  React.useEffect(() => {
    if (!isDragging) return
    const recomputeHover = (e: PointerEvent) => {
      const rect = handleRef.current?.getBoundingClientRect()
      if (!rect) {
        setIsHovered(false)
        return
      }
      setIsHovered(
        e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
      )
    }
    window.addEventListener('pointerup', recomputeHover)
    window.addEventListener('pointercancel', recomputeHover)
    return () => {
      window.removeEventListener('pointerup', recomputeHover)
      window.removeEventListener('pointercancel', recomputeHover)
    }
  }, [isDragging])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || isDisabled) return
    context.onHandleKeyDown(index, e)
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
    if (!isDisabled) {
      setIsFocused(true)
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    onBlur?.(e)
    setIsFocused(false)
    cancelKeyboardSession(index)
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(e)
    if (e.defaultPrevented || isDisabled) return
    context.onHandlePointerDown(index, e)
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

  return (
    <SplitterHandleContext.Provider value={handleContextValue}>
      <Div
        ref={handleRef}
        role="separator"
        tabIndex={isDisabled ? -1 : 0}
        aria-valuenow={Math.round(separatorAria.valueNow)}
        aria-valuemin={separatorAria.valueMin}
        aria-valuemax={separatorAria.valueMax}
        aria-controls={primaryPanelId || undefined}
        aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
        data-reference-splitter-handle=""
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

interface ActivePointerSession {
  handleIndex: number
  pointerId: number
  cancel: () => void
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

    // Sessions outlive renders: callbacks, constraints, and value stay live
    // through this ref so mid-gesture swaps apply to the captured origin.
    const latestRef = React.useRef({ value, panelConstraints, onChange, onChangeEnd, isControlled })
    latestRef.current = { value, panelConstraints, onChange, onChangeEnd, isControlled }

    // Nearest-context Panel registry: ids for aria-controls plus owned
    // elements for data-resizing. Nested groups register to their own Root.
    const panelRegistryRef = React.useRef(
      new Map<number, { id: string; element: HTMLDivElement | null }>()
    )
    const [partsRevision, setPartsRevision] = React.useState(0)
    const registerPanel = React.useCallback(
      (panelIndex: number, id: string, element: HTMLDivElement | null) => {
        panelRegistryRef.current.set(panelIndex, { id, element })
        setPartsRevision((r) => r + 1)
        return () => {
          const entry = panelRegistryRef.current.get(panelIndex)
          if (entry && entry.id === id) panelRegistryRef.current.delete(panelIndex)
          setPartsRevision((r) => r + 1)
        }
      },
      []
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const getPanelId = React.useCallback(
      (panelIndex: number) => panelRegistryRef.current.get(panelIndex)?.id,
      [partsRevision]
    )

    const [dir, setDir] = React.useState<SplitterDirection>('ltr')
    const updateDir = React.useCallback(() => {
      setDir((prev) => {
        const next = readDirection(containerRef.current)
        return prev === next ? prev : next
      })
    }, [])
    // Re-read every render so React-driven dir switches apply immediately.
    useIsomorphicLayoutEffect(() => {
      updateDir()
    })
    React.useEffect(() => {
      updateDir()
      const root = containerRef.current
      if (!root || typeof MutationObserver === 'undefined') return
      const target =
        root.closest('[dir]') ?? (typeof document !== 'undefined' ? document.documentElement : null)
      if (!target) return
      const observer = new MutationObserver(updateDir)
      observer.observe(target, { attributes: true, attributeFilter: ['dir'] })
      return () => observer.disconnect()
    }, [updateDir])
    const isRtl = dir === 'rtl' && orientation === 'horizontal'

    const primaryPanelIndex = React.useCallback(
      (handleIndex: number) => (isRtl ? handleIndex + 1 : handleIndex),
      [isRtl]
    )

    const getSeparatorAria = React.useCallback(
      (handleIndex: number) => {
        const aria = calculateSeparatorAriaValues({
          layout: value,
          panelConstraints,
          panelIndex: primaryPanelIndex(handleIndex),
        })
        return { valueNow: aria.valueNow, valueMin: aria.valueMin, valueMax: aria.valueMax }
      },
      [value, panelConstraints, primaryPanelIndex]
    )

    // Restore memory, keyed by array position: every accepted expanded size
    // overwrites, so Enter restores the newest feasible expanded size.
    const rememberedSizesRef = React.useRef(new Map<number, number>())
    useIsomorphicLayoutEffect(() => {
      value.forEach((size, panelIndex) => {
        const constraints = panelConstraints[panelIndex]
        if (!constraints?.collapsible) return
        const collapsedSize = constraints.collapsedSize ?? 0
        if (!layoutNumbersEqual(size, collapsedSize) && size > collapsedSize) {
          rememberedSizesRef.current.set(panelIndex, size)
        }
      })
    })

    const keyboardSessionRef = React.useRef<{
      handleIndex: number
      hasInteracted: boolean
      lastLayout: number[]
    }>({ handleIndex: -1, hasInteracted: false, lastLayout: [] })

    const cancelKeyboardSession = React.useCallback((handleIndex: number) => {
      if (keyboardSessionRef.current.handleIndex === handleIndex) {
        keyboardSessionRef.current.hasInteracted = false
      }
    }, [])

    const onHandleKeyDown = React.useCallback(
      (handleIndex: number, e: React.KeyboardEvent<HTMLDivElement>) => {
        if (handleIndex < 0 || handleIndex >= value.length - 1) return
        if (e.ctrlKey || e.metaKey || e.altKey) return

        const isHorizontal = orientation === 'horizontal'
        const step = e.shiftKey ? 10 : 1
        let delta = 0
        let handled = false

        if (isHorizontal) {
          if (e.key === 'ArrowRight') {
            handled = true
            delta = isRtl ? -step : step
          } else if (e.key === 'ArrowLeft') {
            handled = true
            delta = isRtl ? step : -step
          }
        } else {
          if (e.key === 'ArrowDown') {
            handled = true
            delta = step
          } else if (e.key === 'ArrowUp') {
            handled = true
            delta = -step
          }
        }

        if (e.key === 'Home') {
          handled = true
          delta = -(value[handleIndex] ?? 50)
        } else if (e.key === 'End') {
          handled = true
          delta = value[handleIndex + 1] ?? 50
        } else if (e.key === 'Enter') {
          const primary = primaryPanelIndex(handleIndex)
          const constraints = panelConstraints[primary]
          if (constraints?.collapsible) {
            handled = true
            const currentSize = value[primary] ?? 50
            const collapsedSize = constraints.collapsedSize ?? 0
            const minSize = constraints.minSize ?? 0
            let targetSize: number
            if (layoutNumbersEqual(currentSize, collapsedSize)) {
              const remembered = rememberedSizesRef.current.get(primary)
              targetSize = Math.max(minSize, remembered ?? minSize)
            } else {
              rememberedSizesRef.current.set(primary, currentSize)
              targetSize = collapsedSize
            }
            delta = isRtl ? currentSize - targetSize : targetSize - currentSize
          }
        }

        if (!handled) return
        e.preventDefault()

        const nextLayout = adjustLayoutByDelta({
          delta,
          initialLayout: value,
          panelConstraints,
          pivotIndices: [handleIndex, handleIndex + 1],
          prevLayout: value,
          trigger: 'keyboard',
        })
        const hasChanged = nextLayout.some(
          (entry, entryIndex) => !layoutNumbersEqual(entry, value[entryIndex] ?? 0)
        )
        if (!hasChanged) return
        keyboardSessionRef.current = { handleIndex, hasInteracted: true, lastLayout: nextLayout }
        if (!isControlled) {
          setInternalValue(nextLayout)
        }
        onChange?.(nextLayout)
      },
      [isControlled, isRtl, onChange, orientation, panelConstraints, primaryPanelIndex, value]
    )

    const onHandleKeyUp = React.useCallback(() => {
      if (keyboardSessionRef.current.hasInteracted) {
        keyboardSessionRef.current.hasInteracted = false
        latestRef.current.onChangeEnd?.(keyboardSessionRef.current.lastLayout)
      }
    }, [])

    const [isResizing, setIsResizing] = React.useState(false)
    const [resizingHandleIndex, setResizingHandleIndex] = React.useState<number | null>(null)
    const activeSessionRef = React.useRef<ActivePointerSession | null>(null)

    const cancelOwnedSession = React.useCallback(
      (handleIndex: number) => {
        cancelKeyboardSession(handleIndex)
        const session = activeSessionRef.current
        if (session && session.handleIndex === handleIndex) session.cancel()
      },
      [cancelKeyboardSession]
    )

    React.useEffect(() => {
      return () => {
        activeSessionRef.current?.cancel()
        activeSessionRef.current = null
      }
    }, [])

    const onHandlePointerDown = React.useCallback(
      (handleIndex: number, e: React.PointerEvent<HTMLDivElement>) => {
        if (e.button !== 0) return
        if (e.isPrimary === false) return
        if (activeSessionRef.current !== null) return
        if (handleIndex < 0 || handleIndex >= value.length - 1) return

        const containerEl = containerRef.current
        if (!containerEl) return

        updateDir()
        const isHorizontal = orientation === 'horizontal'
        const sessionIsRtl = readDirection(containerEl) === 'rtl' && isHorizontal
        const rect = containerEl.getBoundingClientRect()
        const containerSize = isHorizontal ? rect.width : rect.height
        if (containerSize <= 0) return

        const handleEl = e.currentTarget
        const pointerId = e.pointerId

        try {
          handleEl.setPointerCapture(pointerId)
        } catch {}

        handleEl.focus()

        containerEl.setAttribute('data-resizing', '')
        handleEl.setAttribute('data-resizing', '')
        const ownPanels: HTMLElement[] = []
        panelRegistryRef.current.forEach((entry) => {
          if (entry.element) {
            entry.element.setAttribute('data-resizing', '')
            ownPanels.push(entry.element)
          }
        })

        const ownerDoc =
          handleEl.ownerDocument ?? (typeof document !== 'undefined' ? document : undefined)
        const ownerWindow =
          ownerDoc?.defaultView ?? (typeof window !== 'undefined' ? window : undefined)
        const originalUserSelect = ownerDoc?.body?.style.userSelect ?? ''
        const originalCursor = ownerDoc?.body?.style.cursor ?? ''
        if (ownerDoc?.body) {
          ownerDoc.body.style.userSelect = 'none'
          ownerDoc.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize'
        }

        setIsResizing(true)
        setResizingHandleIndex(handleIndex)

        const originLayout = [...value]
        const originPointer = isHorizontal ? e.clientX : e.clientY
        let lastRequested = [...originLayout]
        let emittedAny = false
        let settled = false

        const solveAndEmit = (deltaPercent: number) => {
          const latest = latestRef.current
          const nextLayout = adjustLayoutByDelta({
            delta: deltaPercent,
            initialLayout: originLayout,
            panelConstraints: latest.panelConstraints,
            pivotIndices: [handleIndex, handleIndex + 1],
            prevLayout: latest.value,
            trigger: 'mouse-or-touch',
          })
          // Compare against the last emitted request, not the controlled
          // value: a parent that rejects every request must not receive the
          // same clamped candidate twice.
          const unchanged =
            nextLayout.length === lastRequested.length &&
            nextLayout.every((entry, entryIndex) =>
              layoutNumbersEqual(entry, lastRequested[entryIndex] ?? 0)
            )
          if (unchanged) return
          lastRequested = nextLayout
          emittedAny = true
          if (!latest.isControlled) {
            setInternalValue(nextLayout)
          }
          latest.onChange?.(nextLayout)
        }

        const cleanup = (outcome: 'end' | 'cancel') => {
          if (settled) return
          settled = true
          activeSessionRef.current = null

          ownerWindow?.removeEventListener('pointermove', onPointerMove)
          ownerWindow?.removeEventListener('pointerup', onPointerUp)
          ownerWindow?.removeEventListener('pointercancel', onPointerCancel)
          ownerWindow?.removeEventListener('mousedown', onSecondaryDown, true)
          handleEl.removeEventListener('lostpointercapture', onLostCapture)
          ownerWindow?.removeEventListener('blur', onWindowBlur)

          try {
            if (
              typeof handleEl.hasPointerCapture === 'function' &&
              handleEl.hasPointerCapture(pointerId)
            ) {
              handleEl.releasePointerCapture(pointerId)
            }
          } catch {}

          if (ownerDoc?.body) {
            ownerDoc.body.style.userSelect = originalUserSelect
            ownerDoc.body.style.cursor = originalCursor
          }

          containerEl.removeAttribute('data-resizing')
          handleEl.removeAttribute('data-resizing')
          for (const panel of ownPanels) panel.removeAttribute('data-resizing')

          setIsResizing(false)
          setResizingHandleIndex(null)

          if (outcome === 'end' && emittedAny) {
            latestRef.current.onChangeEnd?.(lastRequested)
          }
        }

        const toDeltaPercent = (clientX: number, clientY: number) => {
          const currentPointer = isHorizontal ? clientX : clientY
          const directed = sessionIsRtl
            ? originPointer - currentPointer
            : currentPointer - originPointer
          return (directed / containerSize) * 100
        }

        const onPointerMove = (moveEv: PointerEvent) => {
          if (moveEv.pointerId !== pointerId) return
          // A move with no buttons means the release was missed: abort.
          if (moveEv.buttons === 0) {
            cleanup('cancel')
            return
          }
          solveAndEmit(toDeltaPercent(moveEv.clientX, moveEv.clientY))
        }

        const onPointerUp = (upEv: PointerEvent) => {
          if (upEv.pointerId !== pointerId) return
          solveAndEmit(toDeltaPercent(upEv.clientX, upEv.clientY))
          cleanup('end')
        }

        const onPointerCancel = (cancelEv: PointerEvent) => {
          if (cancelEv.pointerId !== pointerId) return
          cleanup('cancel')
        }

        const onLostCapture = () => {
          cleanup('cancel')
        }

        const onWindowBlur = () => {
          cleanup('cancel')
        }

        // A secondary click terminates the session at the last candidate;
        // the still-held primary release afterwards is a no-op.
        const onSecondaryDown = (secEv: MouseEvent) => {
          if (secEv.button === 2) cleanup('end')
        }

        ownerWindow?.addEventListener('pointermove', onPointerMove)
        ownerWindow?.addEventListener('pointerup', onPointerUp)
        ownerWindow?.addEventListener('pointercancel', onPointerCancel)
        ownerWindow?.addEventListener('mousedown', onSecondaryDown, true)
        handleEl.addEventListener('lostpointercapture', onLostCapture)
        ownerWindow?.addEventListener('blur', onWindowBlur)

        activeSessionRef.current = { handleIndex, pointerId, cancel: () => cleanup('cancel') }
      },
      [orientation, updateDir, value]
    )

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

    const contextValue = React.useMemo<SplitterContextValue>(
      () => ({
        orientation,
        value,
        disabled,
        isRtl,
        isResizing,
        resizingHandleIndex,
        panelConstraints,
        primaryPanelIndex,
        getPanelId,
        registerPanel,
        getSeparatorAria,
        cancelOwnedSession,
        cancelKeyboardSession,
        onHandlePointerDown,
        onHandleKeyDown,
        onHandleKeyUp,
      }),
      [
        orientation,
        value,
        disabled,
        isRtl,
        isResizing,
        resizingHandleIndex,
        panelConstraints,
        primaryPanelIndex,
        getPanelId,
        registerPanel,
        getSeparatorAria,
        cancelOwnedSession,
        cancelKeyboardSession,
        onHandlePointerDown,
        onHandleKeyDown,
        onHandleKeyUp,
      ]
    )

    return (
      <SplitterContext.Provider value={contextValue}>
        <Div
          ref={handleRef}
          data-reference-splitter=""
          data-orientation={orientation}
          data-resizing={isResizing ? '' : undefined}
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
          <style>{SPLITTER_STYLES}</style>
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
