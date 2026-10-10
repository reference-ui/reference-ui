/**
 * usePointerResize: the drag session behind handle pointer gestures. One
 * capture per gesture — origin pointer/layout, available group size, and
 * the percentage constraint table — plus frozen separator ARIA and blocked
 * flags, so no per-move ARIA writes happen even when the parent accepts
 * everything. Each move turn writes geometry synchronously through refs
 * then requests; release reports one onChangeEnd, cancel and blur report
 * nothing, and a rejecting parent snaps back without waiting for a commit.
 */
import * as React from 'react'
import {
  adjustLayoutByDelta,
  calculateSeparatorAriaValues,
  isHandleBlocked as probeHandleBlocked,
  layoutNumbersEqual,
  type PanelConstraints,
} from '../math/splitter-math'
import type { RegisteredHandle, RegisteredPanel } from '../context'
import type { SplitterOrientation } from '../types'
import {
  DEFAULT_PANEL_MAX_SIZE,
  DEFAULT_PANEL_MIN_SIZE,
  PANEL_SIZE_VAR,
  rootSizeVar,
  restoreInline,
  sanitizeBoundNumber,
} from '../shared/geometry'
import type { MeasuredEntry } from '../shared/measured'
import { readDirection } from '../shared/direction'
import type { SessionFreeze } from './use-separator-model'

export interface ActivePointerSession {
  handleIndex: number
  pointerId: number
  cancel: () => void
}

export interface PointerResizeOptions {
  containerRef: React.RefObject<HTMLDivElement | null>
  value: number[]
  orientation: SplitterOrientation
  updateDir: () => void
  measureAvailable: () => number
  resolveMeasuredTable: (available: number) => Map<string, MeasuredEntry>
  publishMeasuredTable: (next: Map<string, MeasuredEntry>) => void
  isHandleBlocked: (handleIndex: number, explicitDisabled: boolean) => boolean
  cancelKeyboardSession: (handleIndex: number) => void
  latestRef: React.MutableRefObject<{
    value: number[]
    onChange: ((value: number[]) => void) | undefined
    onChangeEnd: ((value: number[]) => void) | undefined
  }>
  panelsRef: React.MutableRefObject<RegisteredPanel[]>
  handlesRef: React.MutableRefObject<RegisteredHandle[]>
  sessionFreezeRef: React.MutableRefObject<SessionFreeze | null>
  activeSessionRef: React.MutableRefObject<ActivePointerSession | null>
}

export interface PointerResize {
  isResizing: boolean
  resizingHandleIndex: number | null
  cancelOwnedSession: (handleIndex: number) => void
  onHandlePointerDown: (handleIndex: number, e: React.PointerEvent<HTMLDivElement>) => void
}

export function usePointerResize(options: PointerResizeOptions): PointerResize {
  const {
    containerRef,
    value,
    orientation,
    updateDir,
    measureAvailable,
    resolveMeasuredTable,
    publishMeasuredTable,
    isHandleBlocked,
    cancelKeyboardSession,
    latestRef,
    panelsRef,
    handlesRef,
    sessionFreezeRef,
    activeSessionRef,
  } = options

  // FEATURES #4: synchronous geometry write through element refs — the
  // per-move visual authority. Stale indexed Root variables are removed
  // when the Panel count shrinks.
  const geometryVarCountRef = React.useRef(0)
  const writeGeometryVars = React.useCallback(
    (layout: number[]) => {
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
    },
    [containerRef, panelsRef]
  )

  const [isResizing, setIsResizing] = React.useState(false)
  const [resizingHandleIndex, setResizingHandleIndex] = React.useState<number | null>(null)

  const cancelOwnedSession = React.useCallback(
    (handleIndex: number) => {
      cancelKeyboardSession(handleIndex)
      const session = activeSessionRef.current
      if (session && session.handleIndex === handleIndex) session.cancel()
    },
    [activeSessionRef, cancelKeyboardSession]
  )

  React.useEffect(() => {
    return () => {
      activeSessionRef.current?.cancel()
      activeSessionRef.current = null
    }
  }, [activeSessionRef])

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
      const bodyStyle = ownerDoc?.body?.style
      const originalUserSelect = bodyStyle?.getPropertyValue('user-select') ?? ''
      const originalWebkitUserSelect = bodyStyle?.getPropertyValue('-webkit-user-select') ?? ''
      const originalCursor = bodyStyle?.getPropertyValue('cursor') ?? ''
      if (bodyStyle) {
        // setProperty, not the userSelect IDL: WebKit has no userSelect
        // IDL (assignment is a dead expando, selection leaks), and
        // ignores unprefixed user-select entirely — the -webkit- property
        // carries the lock there. Both restore below.
        bodyStyle.setProperty('user-select', 'none')
        bodyStyle.setProperty('-webkit-user-select', 'none')
        bodyStyle.setProperty('cursor', isHorizontal ? 'col-resize' : 'row-resize')
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

        if (bodyStyle) {
          restoreInline(bodyStyle, 'user-select', originalUserSelect)
          restoreInline(bodyStyle, '-webkit-user-select', originalWebkitUserSelect)
          restoreInline(bodyStyle, 'cursor', originalCursor)
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
      activeSessionRef,
      containerRef,
      handlesRef,
      isHandleBlocked,
      latestRef,
      measureAvailable,
      orientation,
      panelsRef,
      publishMeasuredTable,
      resolveMeasuredTable,
      sessionFreezeRef,
      updateDir,
      value,
      writeGeometryVars,
    ]
  )

  return { isResizing, resizingHandleIndex, cancelOwnedSession, onHandlePointerDown }
}
