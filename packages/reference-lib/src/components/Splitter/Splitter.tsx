import * as React from 'react'
import { Div, type PrimitiveProps, type PrimitiveElement } from '@reference-ui/react'
import {
  adjustLayoutByDelta,
  calculateSeparatorAriaValues,
  isHandleBlocked as probeHandleBlocked,
  layoutNumbersEqual,
  measureAvailableGroupSize,
  resolveConstraintToPercentage,
  validateLayout,
  validatePanelConstraints,
  validateSplitterStructure,
  type PanelConstraints,
  type SplitterStructurePart,
} from './splitter-math'
import { SPLITTER_STYLES } from './splitterStyles'

export type SplitterOrientation = 'horizontal' | 'vertical'

// Decided resize floor (FEATURES #10: KEEP 5%): an unconstrained Panel
// clamps to >= 5% under drag/keys. Pinned by the SP-DOM-03 CT slices.
const DEFAULT_PANEL_MIN_SIZE = 5
const DEFAULT_PANEL_MAX_SIZE = 100

// FEATURES #4: the frozen geometry contract. Panels size from their own
// variable; Root publishes indexed variables in Panel order for consumer
// CSS. The kernel never writes inline flex-basis/width or grid-template-*
// as a competing signal.
const PANEL_SIZE_VAR = '--reference-splitter-panel-size'
const PANEL_FLEX = `1 1 var(${PANEL_SIZE_VAR})`
function rootSizeVar(panelIndex: number): string {
  return `--reference-splitter-${panelIndex + 1}`
}

// Pre-registration Handle ARIA: order is unknown on the server and on the
// first client render, so separators render this safe range until layout
// effects register them (before paint on the client).
const UNREGISTERED_SEPARATOR_ARIA: SplitterSeparatorAria = {
  valueNow: 50,
  valueMin: 0,
  valueMax: 100,
}

const globalProcess = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process

function warnSplitter(message: string) {
  if (globalProcess?.env?.NODE_ENV === 'production') return
  console.error(`[Reference UI Splitter] ${message}`)
}

// FEATURES #3: numeric solver input from DOM-ordered Panel registrations.
// Numbers are live every render; measured strings resolve post-mount at
// pointerdown capture and on idle resize, and land here through `measured`.
// Unresolved strings (SSR, zero size) and parse failures silently take the
// default bound — the dev diagnostic for genuinely invalid input comes from
// the raw-prop validatePanelConstraints check, not this hot function.
interface MeasuredEntry {
  min: number | null
  max: number | null
}

function sanitizeBoundNumber(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback
}

function toSolverConstraints(
  panels: RegisteredPanel[],
  measured: ReadonlyMap<string, MeasuredEntry>
): PanelConstraints[] {
  return panels.map((panel) => {
    const entry = measured.get(panel.key)
    const minSize =
      typeof panel.min === 'number'
        ? sanitizeBoundNumber(panel.min, DEFAULT_PANEL_MIN_SIZE)
        : (entry?.min ?? DEFAULT_PANEL_MIN_SIZE)
    const maxSize =
      typeof panel.max === 'number'
        ? sanitizeBoundNumber(panel.max, DEFAULT_PANEL_MAX_SIZE)
        : (entry?.max ?? DEFAULT_PANEL_MAX_SIZE)
    return {
      minSize,
      maxSize,
      collapsible: panel.collapsible,
      collapsedSize: sanitizeBoundNumber(panel.collapsedSize, 0),
    }
  })
}

// One string bound resolved against the captured available size, or null
// when the prop is not a string (the live-number path owns those).
function resolveMeasuredBound(
  raw: number | string | undefined,
  element: HTMLDivElement | null,
  availableGroupSize: number,
  fallback: number
): number | null {
  if (typeof raw !== 'string') return null
  return resolveConstraintToPercentage(raw, availableGroupSize, element, fallback)
}

function measuredEntriesEqual(
  a: ReadonlyMap<string, MeasuredEntry>,
  b: ReadonlyMap<string, MeasuredEntry>
): boolean {
  if (a.size !== b.size) return false
  for (const [key, entry] of a) {
    const other = b.get(key)
    if (!other || other.min !== entry.min || other.max !== entry.max) return false
  }
  return true
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

export type SplitterProps = Omit<PrimitiveProps<'div'>, 'onChange' | 'display' | 'flexDirection'> & {
  orientation?: SplitterOrientation
  value: number[]
  onChange?: (value: number[]) => void
  onChangeEnd?: (value: number[]) => void
}

export interface SplitterSeparatorAria {
  valueNow: number
  valueMin: number
  valueMax: number
}

interface RegisteredPanel {
  key: string
  id: string
  element: HTMLDivElement | null
  min: number | string | undefined
  max: number | string | undefined
  collapsible: boolean
  collapsedSize: number
}

interface RegisteredHandle {
  key: string
  element: HTMLDivElement | null
  disabled: boolean
}

interface SplitterContextValue {
  orientation: SplitterOrientation
  value: number[]
  isRtl: boolean
  isResizing: boolean
  resizingHandleIndex: number | null
  panelConstraints: PanelConstraints[]
  primaryPanelIndex: (handleIndex: number) => number
  getPanelId: (panelIndex: number) => string | undefined
  getPanelIndex: (key: string) => number
  getHandleIndex: (key: string) => number
  registerPanel: (panel: RegisteredPanel) => () => void
  registerHandle: (handle: RegisteredHandle) => () => void
  getSeparatorAria: (handleIndex: number) => SplitterSeparatorAria
  isHandleBlocked: (handleIndex: number, explicitDisabled: boolean) => boolean
  cancelOwnedSession: (handleIndex: number) => void
  cancelKeyboardSession: (handleIndex: number) => void
  onHandlePointerDown: (handleIndex: number, e: React.PointerEvent<HTMLDivElement>) => void
  onHandleKeyDown: (handleIndex: number, e: React.KeyboardEvent<HTMLDivElement>) => void
  onHandleKeyUp: () => void
}

const SplitterContext = React.createContext<SplitterContextValue | null>(null)

export type SplitterPanelProps = Omit<
  PrimitiveProps<'div'>,
  'flexGrow' | 'flexShrink' | 'flexBasis' | 'flex'
> & {
  min?: number | string
  max?: number | string
  collapsible?: boolean
  collapsedSize?: number
}

export function SplitterPanel({
  children,
  min,
  max,
  id: idProp,
  collapsible = false,
  collapsedSize = 0,
  className,
  style,
  ...props
}: SplitterPanelProps) {
  const context = React.useContext(SplitterContext)
  const orientation = context?.orientation ?? 'horizontal'

  // Pin the first render's id: the React 17 CT shim mints a fresh useId
  // per render, and DOM-order registration keys off this value.
  const autoId = React.useId().replace(/:/g, '')
  const [stableAutoId] = React.useState(autoId)
  const panelId = idProp ?? `splitter-panel-${stableAutoId}`
  const panelIndex = context?.getPanelIndex(stableAutoId) ?? -1
  const size = panelIndex >= 0 ? (context?.value[panelIndex] ?? 50) : 50

  const panelRef = React.useRef<HTMLDivElement | null>(null)
  const registerPanel = context?.registerPanel
  useIsomorphicLayoutEffect(() => {
    if (!registerPanel) return
    return registerPanel({
      key: stableAutoId,
      id: panelId,
      element: panelRef.current,
      min,
      max,
      collapsible,
      collapsedSize,
    })
  }, [registerPanel, stableAutoId, panelId, min, max, collapsible, collapsedSize])

  const isCollapsed = collapsible && layoutNumbersEqual(size, collapsedSize)

  // FEATURES #4: the kernel owns flex on the layout axis, so the owned
  // declarations come after consumer style. Pointer sessions rewrite the
  // same variable through the element ref; React only rewrites it when the
  // controlled value actually changes.
  const geometryStyle = {
    ...style,
    flex: PANEL_FLEX,
    [PANEL_SIZE_VAR]: `${size}%`,
  } as React.CSSProperties

  return (
    <Div
      ref={panelRef}
      id={panelId}
      data-reference-splitter-panel=""
      data-collapsed={isCollapsed ? '' : undefined}
      data-resizing={context?.isResizing ? '' : undefined}
      minWidth={orientation === 'horizontal' ? 0 : undefined}
      minHeight={orientation === 'vertical' ? 0 : undefined}
      overflow="auto"
      className={className}
      style={geometryStyle}
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

export type SplitterHandleProps = Omit<
  PrimitiveProps<'div'>,
  'flexGrow' | 'flexShrink' | 'flexBasis' | 'flex'
> & {
  disabled?: boolean
  withThumb?: boolean
}

export function SplitterHandle({
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
}: SplitterHandleProps) {
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
  const handleRef = React.useRef<HTMLDivElement>(null)

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

  return (
    <SplitterHandleContext.Provider value={handleContextValue}>
      <Div
        ref={handleRef}
        role="separator"
        tabIndex={0}
        aria-valuenow={Math.round(separatorAria.valueNow)}
        aria-valuemin={separatorAria.valueMin}
        aria-valuemax={separatorAria.valueMax}
        aria-controls={primaryPanelId || undefined}
        aria-disabled={isBlocked ? true : undefined}
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
        cursor={isBlocked ? 'default' : isHorizontal ? 'col-resize' : 'row-resize'}
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
      value,
      onChange,
      onChangeEnd,
      className,
      style,
      ...props
    },
    forwardedRef
  ) {
    const containerRef = React.useRef<HTMLDivElement | null>(null)

    // Nearest-context part registries: Panels and Handles register from
    // layout effects and stay sorted in DOM order, so array position always
    // means document position (insert/remove/reorder included). Nested
    // groups register to their own Root through the nearest context.
    const panelsRef = React.useRef<RegisteredPanel[]>([])
    const handlesRef = React.useRef<RegisteredHandle[]>([])
    const [partsRevision, setPartsRevision] = React.useState(0)

    const sortParts = React.useCallback(() => {
      panelsRef.current.sort((a, b) => {
        if (!a.element || !b.element) return 0
        const pos = a.element.compareDocumentPosition(b.element)
        return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
      })
      handlesRef.current.sort((a, b) => {
        if (!a.element || !b.element) return 0
        const pos = a.element.compareDocumentPosition(b.element)
        return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
      })
    }, [])

    const registerPanel = React.useCallback(
      (panel: RegisteredPanel) => {
        const existingIndex = panelsRef.current.findIndex((p) => p.key === panel.key)
        if (existingIndex >= 0) {
          panelsRef.current[existingIndex] = panel
        } else {
          panelsRef.current.push(panel)
        }
        sortParts()
        setPartsRevision((r) => r + 1)
        return () => {
          panelsRef.current = panelsRef.current.filter((p) => p.key !== panel.key)
          sortParts()
          setPartsRevision((r) => r + 1)
        }
      },
      [sortParts]
    )

    const registerHandle = React.useCallback(
      (handle: RegisteredHandle) => {
        const existingIndex = handlesRef.current.findIndex((h) => h.key === handle.key)
        if (existingIndex >= 0) {
          handlesRef.current[existingIndex] = handle
        } else {
          handlesRef.current.push(handle)
        }
        sortParts()
        setPartsRevision((r) => r + 1)
        return () => {
          handlesRef.current = handlesRef.current.filter((h) => h.key !== handle.key)
          sortParts()
          setPartsRevision((r) => r + 1)
        }
      },
      [sortParts]
    )

    const getPanelIndex = React.useCallback(
      (key: string) => panelsRef.current.findIndex((p) => p.key === key),
      []
    )
    const getHandleIndex = React.useCallback(
      (key: string) => handlesRef.current.findIndex((h) => h.key === key),
      []
    )

    // FEATURES #3: measured strings resolve outside render (idle effect,
    // ResizeObserver, pointerdown capture) into this ref; the version bump
    // below is the only render trigger, and only when values change.
    const measuredRef = React.useRef(new Map<string, MeasuredEntry>())
    const [measuredVersion, setMeasuredVersion] = React.useState(0)
    void measuredVersion
    const panelConstraints = toSolverConstraints(panelsRef.current, measuredRef.current)

    if (globalProcess?.env?.NODE_ENV !== 'production') {
      // Count mismatches throw structurally (FEATURES #9); this warns only
      // for malformed entries and off-100 totals.
      const layoutCheck = validateLayout(value)
      if (!layoutCheck.valid && layoutCheck.error) warnSplitter(layoutCheck.error)
      // Raw props, so invalid measured strings warn with a
      // property-specific diagnostic while the solver ignores them.
      const constraintCheck = validatePanelConstraints(
        panelsRef.current.map((panel) => ({
          id: panel.id,
          min: panel.min,
          max: panel.max,
          collapsible: panel.collapsible,
          collapsedSize: panel.collapsedSize,
        }))
      )
      if (!constraintCheck.valid && constraintCheck.error) warnSplitter(constraintCheck.error)
    }

    // Sessions outlive renders: callbacks and value stay live through this
    // ref so mid-gesture swaps apply to the captured origin. Numeric
    // constraints stay live through panelsRef; measured strings stay
    // captured (SP-CTRL-05 vs SP-PERF-06).
    const latestRef = React.useRef({ value, onChange, onChangeEnd })
    latestRef.current = { value, onChange, onChangeEnd }

    // FEATURES #5: while a pointer session is active, separator ARIA and
    // blocked flags are frozen at their pointerdown values — no per-move
    // ARIA writes even when the parent accepts every candidate.
    const sessionFreezeRef = React.useRef<{
      aria: SplitterSeparatorAria[]
      blocked: boolean[]
    } | null>(null)

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const getPanelId = React.useCallback(
      (panelIndex: number) => panelsRef.current[panelIndex]?.id,
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
        const frozen = sessionFreezeRef.current
        if (frozen && handleIndex >= 0 && handleIndex < frozen.aria.length) {
          return frozen.aria[handleIndex] ?? UNREGISTERED_SEPARATOR_ARIA
        }
        if (
          handleIndex < 0 ||
          handleIndex >= value.length - 1 ||
          panelConstraints.length !== value.length
        ) {
          return UNREGISTERED_SEPARATOR_ARIA
        }
        const aria = calculateSeparatorAriaValues({
          layout: value,
          panelConstraints,
          panelIndex: primaryPanelIndex(handleIndex),
        })
        return { valueNow: aria.valueNow, valueMin: aria.valueMin, valueMax: aria.valueMax }
      },
      [value, panelConstraints, primaryPanelIndex]
    )

    // FEATURES #7: explicit disabled plus solver-probed infeasibility.
    // Unregistered Handles (SSR, first render) report only their explicit
    // flag so server and client agree before measurement exists.
    const isHandleBlocked = React.useCallback(
      (handleIndex: number, explicitDisabled: boolean) => {
        const frozen = sessionFreezeRef.current
        if (frozen && handleIndex >= 0 && handleIndex < frozen.blocked.length) {
          return frozen.blocked[handleIndex] ?? true
        }
        if (
          handleIndex < 0 ||
          handlesRef.current.length !== value.length - 1 ||
          panelConstraints.length !== value.length
        ) {
          return explicitDisabled
        }
        if (explicitDisabled || handlesRef.current[handleIndex]?.disabled) return true
        return probeHandleBlocked({
          layout: value,
          panelConstraints,
          handleIndex,
        })
      },
      [value, panelConstraints]
    )

    // FEATURES #6: restore memory keyed by stable Panel id, never array
    // position — reorder keeps, remove isolates, reinsert must recover. Every
    // accepted expanded size overwrites, so Enter restores the newest
    // feasible expanded size. Entries survive unregister (recovery needs
    // them); ids are per-instance strings, so the map stays tiny.
    const rememberedSizesRef = React.useRef(new Map<string, number>())
    // DOM order is the source of truth for array position: a
    // key-preserving reorder moves parts without (un)registering, so the
    // registries must re-sort on every commit — before the positional reads
    // below — or a transient commit pairs sizes with the wrong Panel ids.
    // Sorts in place (cheap, idempotent); only an actual order change
    // re-renders, pre-paint, so the transient render never shows.
    useIsomorphicLayoutEffect(() => {
      const orderKey = () =>
        `${panelsRef.current.map((part) => part.key).join(',')}|${handlesRef.current.map((part) => part.key).join(',')}`
      const before = orderKey()
      sortParts()
      if (orderKey() !== before) setPartsRevision((revision) => revision + 1)
    })
    useIsomorphicLayoutEffect(() => {
      value.forEach((size, panelIndex) => {
        const panel = panelsRef.current[panelIndex]
        if (!panel?.collapsible) return
        // Entry-owned fields: they travel with the Panel id, so this read
        // stays correct even when render-time positional tables lag the
        // just-synced registry by one commit.
        const collapsedSize = sanitizeBoundNumber(panel.collapsedSize, 0)
        if (!layoutNumbersEqual(size, collapsedSize) && size > collapsedSize) {
          rememberedSizesRef.current.set(panel.id, size)
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
        // Blocked Handles consume nothing: no preventDefault, no callback.
        if (isHandleBlocked(handleIndex, handlesRef.current[handleIndex]?.disabled ?? false)) {
          return
        }
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
          const primaryId = panelsRef.current[primary]?.id
          if (constraints?.collapsible && primaryId !== undefined) {
            handled = true
            const currentSize = value[primary] ?? 50
            const collapsedSize = constraints.collapsedSize ?? 0
            const minSize = constraints.minSize ?? 0
            let targetSize: number
            if (layoutNumbersEqual(currentSize, collapsedSize)) {
              const remembered = rememberedSizesRef.current.get(primaryId)
              targetSize = Math.max(minSize, remembered ?? minSize)
            } else {
              rememberedSizesRef.current.set(primaryId, currentSize)
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
        onChange?.(nextLayout)
      },
      [isHandleBlocked, isRtl, onChange, orientation, panelConstraints, primaryPanelIndex, value]
    )

    const onHandleKeyUp = React.useCallback(() => {
      if (keyboardSessionRef.current.hasInteracted) {
        keyboardSessionRef.current.hasInteracted = false
        latestRef.current.onChangeEnd?.(keyboardSessionRef.current.lastLayout)
      }
    }, [])

    // FEATURES #3/#8: the idle measurement path. Numbers never enter the
    // table (they stay live); strings resolve against the measured
    // available size. Retries while unmeasurable; never divides by zero.
    const measureAvailable = React.useCallback(() => {
      return measureAvailableGroupSize({
        container: containerRef.current,
        handles: handlesRef.current.map((handle) => handle.element),
        orientation,
      })
    }, [orientation])

    const resolveMeasuredTable = React.useCallback((available: number) => {
      const next = new Map<string, MeasuredEntry>()
      for (const panel of panelsRef.current) {
        next.set(panel.key, {
          min: resolveMeasuredBound(
            panel.min,
            panel.element,
            available,
            DEFAULT_PANEL_MIN_SIZE
          ),
          max: resolveMeasuredBound(
            panel.max,
            panel.element,
            available,
            DEFAULT_PANEL_MAX_SIZE
          ),
        })
      }
      return next
    }, [])

    const publishMeasuredTable = React.useCallback((next: Map<string, MeasuredEntry>) => {
      if (measuredEntriesEqual(measuredRef.current, next)) return
      measuredRef.current = next
      setMeasuredVersion((version) => version + 1)
    }, [])

    // FEATURES #4: synchronous geometry write through element refs — the
    // per-move visual authority. Stale indexed Root variables are removed
    // when the Panel count shrinks.
    const geometryVarCountRef = React.useRef(0)
    const writeGeometryVars = React.useCallback((layout: number[]) => {
      panelsRef.current.forEach((panel, panelIndex) => {
        panel.element?.style.setProperty(PANEL_SIZE_VAR, `${layout[panelIndex] ?? 0}%`)
      })
      const root = containerRef.current
      if (root) {
        layout.forEach((size, panelIndex) => {
          root.style.setProperty(rootSizeVar(panelIndex), `${size}%`)
        })
        for (let i = layout.length; i < geometryVarCountRef.current; i++) {
          root.style.removeProperty(rootSizeVar(i))
        }
      }
      geometryVarCountRef.current = layout.length
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

    // FEATURES #3 idle path: re-resolve when the registration/constraint
    // shape changes (mount, insert/remove/reorder, min/max edits). Skipped
    // while a session owns the table, and silent while unmeasurable.
    const lastResolvedSignatureRef = React.useRef('')
    useIsomorphicLayoutEffect(() => {
      if (activeSessionRef.current) return
      const signature = panelsRef.current
        .map((panel) => `${panel.key}|${String(panel.min)}|${String(panel.max)}`)
        .join(';')
      if (signature === lastResolvedSignatureRef.current) return
      const available = measureAvailable()
      if (available <= 0) return
      publishMeasuredTable(resolveMeasuredTable(available))
      lastResolvedSignatureRef.current = signature
    })

    // FEATURES #3 idle resize: available-size changes re-resolve measured
    // constraints and ARIA bounds without touching value or callbacks.
    // Never runs while the pointer is down; the gesture keeps its capture.
    React.useEffect(() => {
      const root = containerRef.current
      if (!root || typeof ResizeObserver === 'undefined') return
      const observer = new ResizeObserver(() => {
        if (activeSessionRef.current) return
        const available = measureAvailable()
        if (available <= 0) return
        publishMeasuredTable(resolveMeasuredTable(available))
      })
      observer.observe(root)
      return () => observer.disconnect()
    }, [measureAvailable, publishMeasuredTable, resolveMeasuredTable])

    const onHandlePointerDown = React.useCallback(
      (handleIndex: number, e: React.PointerEvent<HTMLDivElement>) => {
        if (e.button !== 0) return
        if (e.isPrimary === false) return
        if (activeSessionRef.current !== null) return
        if (handleIndex < 0 || handleIndex >= value.length - 1) return
        if (isHandleBlocked(handleIndex, handlesRef.current[handleIndex]?.disabled ?? false)) {
          return
        }

        const containerEl = containerRef.current
        if (!containerEl) return

        updateDir()
        const isHorizontal = orientation === 'horizontal'
        const sessionIsRtl = readDirection(containerEl) === 'rtl' && isHorizontal
        // FEATURES #5/#8: one capture — origin pointer/layout, available
        // group size (Panel-axis sum), and the percentage constraint table.
        const sessionAvailable = measureAvailable()
        if (sessionAvailable <= 0) return
        const sessionMeasured = resolveMeasuredTable(sessionAvailable)
        publishMeasuredTable(sessionMeasured)
        const sessionConstraintsForMove = (): PanelConstraints[] =>
          panelsRef.current.map((panel) => {
            const captured = sessionMeasured.get(panel.key)
            return {
              minSize:
                typeof panel.min === 'number'
                  ? sanitizeBoundNumber(panel.min, DEFAULT_PANEL_MIN_SIZE)
                  : (captured?.min ?? DEFAULT_PANEL_MIN_SIZE),
              maxSize:
                typeof panel.max === 'number'
                  ? sanitizeBoundNumber(panel.max, DEFAULT_PANEL_MAX_SIZE)
                  : (captured?.max ?? DEFAULT_PANEL_MAX_SIZE),
              collapsible: panel.collapsible,
              collapsedSize: sanitizeBoundNumber(panel.collapsedSize, 0),
            }
          })
        const sessionConstraints = sessionConstraintsForMove()
        // Freeze separator ARIA and blocked flags for the gesture: no
        // per-move ARIA writes even when the parent accepts everything.
        sessionFreezeRef.current = {
          aria: value.slice(0, value.length - 1).map((_, frozenIndex) => {
            const frozen = calculateSeparatorAriaValues({
              layout: value,
              panelConstraints: sessionConstraints,
              panelIndex: sessionIsRtl ? frozenIndex + 1 : frozenIndex,
            })
            return {
              valueNow: frozen.valueNow,
              valueMin: frozen.valueMin,
              valueMax: frozen.valueMax,
            }
          }),
          blocked: value.slice(0, value.length - 1).map((_, frozenIndex) => {
            if (handlesRef.current[frozenIndex]?.disabled) return true
            return probeHandleBlocked({
              layout: value,
              panelConstraints: sessionConstraints,
              handleIndex: frozenIndex,
            })
          }),
        }

        const handleEl = e.currentTarget
        const pointerId = e.pointerId

        try {
          handleEl.setPointerCapture(pointerId)
        } catch {}

        handleEl.focus()

        containerEl.setAttribute('data-resizing', '')
        handleEl.setAttribute('data-resizing', '')
        const ownPanels: HTMLElement[] = []
        panelsRef.current.forEach((entry) => {
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
            panelConstraints: sessionConstraintsForMove(),
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
          // The move turn writes geometry synchronously through refs, then
          // requests; no commit, layout read, conversion, or ARIA here.
          writeGeometryVars(nextLayout)
          latest.onChange?.(nextLayout)
        }

        const cleanup = (outcome: 'end' | 'cancel') => {
          if (settled) return
          settled = true
          activeSessionRef.current = null
          sessionFreezeRef.current = null
          // Visual authority returns to the controlled value: a rejecting
          // parent snaps back without waiting for a commit.
          writeGeometryVars(latestRef.current.value)

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
          return (directed / sessionAvailable) * 100
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
      [
        isHandleBlocked,
        measureAvailable,
        orientation,
        publishMeasuredTable,
        resolveMeasuredTable,
        updateDir,
        value,
        writeGeometryVars,
      ]
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

    // FEATURES #9: strict structural errors throw fail-fast. Validation runs
    // in a layout effect — after the children's registration effects, so an
    // atomic insert/remove/reorder commit validates in its final shape —
    // and the recorded error throws during the next render, before paint,
    // with no separator ARIA, capture, or listeners left behind. Terminal
    // for that mount: recovery is an error boundary plus a tree fix.
    const [structureError, setStructureError] = React.useState<string | null>(null)
    useIsomorphicLayoutEffect(() => {
      const merged: Array<{ kind: SplitterStructurePart; element: HTMLDivElement | null }> = [
        ...panelsRef.current.map((panel) => ({
          kind: 'panel' as const,
          element: panel.element,
        })),
        ...handlesRef.current.map((handle) => ({
          kind: 'handle' as const,
          element: handle.element,
        })),
      ]
      merged.sort((a, b) => {
        if (!a.element || !b.element) return 0
        const pos = a.element.compareDocumentPosition(b.element)
        return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
      })
      const check = validateSplitterStructure(
        merged.map((part) => part.kind),
        value.length
      )
      const next = check.valid ? null : (check.error ?? 'Invalid Splitter structure.')
      // W-35 clamp-or-warn: a bad panel layout (e.g. value=[10,10,80] on 2
      // panels — the B-11 silent-collapse instance) dev-warns with the same
      // diagnostic the throw carries, so the failure is loud twice over and
      // never a silent 13px collapse. The throw below stays (FEATURES #9).
      if (!check.valid && next && globalProcess?.env?.NODE_ENV !== 'production') {
        warnSplitter(next)
      }
      setStructureError((prev) => (prev === next ? prev : next))
    })
    if (structureError) {
      throw new Error(`[Reference UI Splitter] ${structureError}`)
    }

    const contextValue = React.useMemo<SplitterContextValue>(() => {
      // Re-publish after every (un)registration so parts re-read DOM order.
      void partsRevision
      return {
        orientation,
        value,
        isRtl,
        isResizing,
        resizingHandleIndex,
        panelConstraints,
        primaryPanelIndex,
        getPanelId,
        getPanelIndex,
        getHandleIndex,
        registerPanel,
        registerHandle,
        getSeparatorAria,
        isHandleBlocked,
        cancelOwnedSession,
        cancelKeyboardSession,
        onHandlePointerDown,
        onHandleKeyDown,
        onHandleKeyUp,
      }
    }, [
      orientation,
      value,
      isRtl,
      isResizing,
      resizingHandleIndex,
      panelConstraints,
      primaryPanelIndex,
      getPanelId,
      getPanelIndex,
      getHandleIndex,
      registerPanel,
      registerHandle,
      getSeparatorAria,
      isHandleBlocked,
      cancelOwnedSession,
      cancelKeyboardSession,
      onHandlePointerDown,
      onHandleKeyDown,
      onHandleKeyUp,
      partsRevision,
    ])

    // FEATURES #4: indexed size signals in Panel order. Owned, so they
    // come after consumer style; unrelated custom properties pass through.
    const rootStyle = {
      ...style,
      ...Object.fromEntries(value.map((size, panelIndex) => [rootSizeVar(panelIndex), `${size}%`])),
    } as React.CSSProperties

    return (
      <SplitterContext.Provider value={contextValue}>
        <Div
          ref={handleRef}
          data-reference-splitter=""
          data-orientation={orientation}
          data-resizing={isResizing ? '' : undefined}
          display="flex"
          flexDirection={orientation === 'vertical' ? 'column' : 'row'}
          width="100%"
          height="100%"
          overflow="hidden"
          className={className}
          style={rootStyle}
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
