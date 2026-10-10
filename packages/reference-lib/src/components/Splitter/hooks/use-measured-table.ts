/**
 * useMeasuredTable: string-bound measurement (FEATURES #3). Numbers never
 * enter the table — they stay live; strings resolve against the measured
 * available size on registration-shape changes (idle layout effect) and on
 * container resizes (ResizeObserver), publishing through the version bump
 * only when values actually change. Never runs while the pointer is down —
 * the gesture keeps its captured table.
 */
import * as React from 'react'
import {
  measureAvailableGroupSize,
  type PanelConstraints,
} from '../math/splitter-math'
import type { RegisteredHandle, RegisteredPanel } from '../context'
import type { SplitterOrientation } from '../types'
import { DEFAULT_PANEL_MAX_SIZE, DEFAULT_PANEL_MIN_SIZE } from '../shared/geometry'
import {
  measuredEntriesEqual,
  resolveMeasuredBound,
  toSolverConstraints,
  type MeasuredEntry,
} from '../shared/measured'
import { useIsomorphicLayoutEffect } from '../shared/refs'

export interface MeasuredTableOptions {
  containerRef: React.RefObject<HTMLDivElement | null>
  panelsRef: React.MutableRefObject<RegisteredPanel[]>
  handlesRef: React.MutableRefObject<RegisteredHandle[]>
  orientation: SplitterOrientation
  isSessionActive: () => boolean
}

export interface MeasuredTable {
  panelConstraints: PanelConstraints[]
  measureAvailable: () => number
  resolveMeasuredTable: (available: number) => Map<string, MeasuredEntry>
  publishMeasuredTable: (next: Map<string, MeasuredEntry>) => void
}

export function useMeasuredTable(options: MeasuredTableOptions): MeasuredTable {
  const { containerRef, panelsRef, handlesRef, orientation, isSessionActive } = options

  // FEATURES #3: measured strings resolve outside render (idle effect,
  // ResizeObserver, pointerdown capture) into this ref; the version bump
  // below is the only render trigger, and only when values change.
  const measuredRef = React.useRef(new Map<string, MeasuredEntry>())
  const [measuredVersion, setMeasuredVersion] = React.useState(0)
  void measuredVersion
  const panelConstraints = toSolverConstraints(panelsRef.current, measuredRef.current)

  // FEATURES #3/#8: the idle measurement path. Numbers never enter the
  // table (they stay live); strings resolve against the measured
  // available size. Retries while unmeasurable; never divides by zero.
  const measureAvailable = React.useCallback(() => {
    return measureAvailableGroupSize({
      container: containerRef.current,
      handles: handlesRef.current.map((handle) => handle.element),
      orientation,
    })
  }, [containerRef, handlesRef, orientation])

  const resolveMeasuredTable = React.useCallback(
    (available: number) => {
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
    },
    [panelsRef]
  )

  const publishMeasuredTable = React.useCallback((next: Map<string, MeasuredEntry>) => {
    if (measuredEntriesEqual(measuredRef.current, next)) return
    measuredRef.current = next
    setMeasuredVersion((version) => version + 1)
  }, [])

  // FEATURES #3 idle path: re-resolve when the registration/constraint
  // shape changes (mount, insert/remove/reorder, min/max edits). Skipped
  // while a session owns the table, and silent while unmeasurable.
  const lastResolvedSignatureRef = React.useRef('')
  useIsomorphicLayoutEffect(() => {
    if (isSessionActive()) return
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
      if (isSessionActive()) return
      const available = measureAvailable()
      if (available <= 0) return
      publishMeasuredTable(resolveMeasuredTable(available))
    })
    observer.observe(root)
    return () => observer.disconnect()
  }, [containerRef, isSessionActive, measureAvailable, publishMeasuredTable, resolveMeasuredTable])

  return { panelConstraints, measureAvailable, resolveMeasuredTable, publishMeasuredTable }
}
