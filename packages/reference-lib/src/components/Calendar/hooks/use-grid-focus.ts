/**
 * Day-grid focus: useGridFocus owns the roving tab target, the
 * cross-month pending focus, and the every-render repair effect that
 * applies pending requests, relocates lost targets, and rebuilds
 * grid-owned DOM focus only when it fell to body. DOM focus follows
 * only when it was grid-owned: live in the grid, or dropped by the
 * same commit's disable/unmount.
 */
import * as React from 'react'
import type { GridDay, MonthGrid } from '../dates/grid'
import type { ISOMonth } from '../dates/iso'
import { computePreferredTarget, nearestFocusableTarget } from '../day-grid/targets'
import type { ISODate } from '../types'

export interface GridFocusOptions {
  grid: MonthGrid
  renderedDays: GridDay[]
  renderedSet: Set<string>
  isDisabled: (date: ISODate) => boolean
  isSelected: (date: ISODate) => boolean
  markerToday: ISODate | null
  showingMonth: ISOMonth
  /** The pane rebuilt under a possibly stationary pointer: the hover
   * candidate may be gone or rebound, so the Grid drops it. */
  onGridRebuilt: () => void
}

export function useGridFocus(options: GridFocusOptions) {
  const {
    grid,
    renderedDays,
    renderedSet,
    isDisabled,
    isSelected,
    markerToday,
    showingMonth,
    onGridRebuilt,
  } = options

  const gridRef = React.useRef<HTMLTableElement>(null)

  const [focusedDate, setFocusedDate] = React.useState<ISODate | null>(() =>
    computePreferredTarget(renderedDays, isDisabled, isSelected, markerToday)
  )

  // Cross-month keyboard/outside-day focus (CA-KEY-07, CA-MONTH-07):
  // requested but not yet rendered. Applied after the parent commits
  // the month; dropped when stale (CA-KEY-10).
  const pendingFocusRef = React.useRef<{
    date: ISODate
    focusWasInGrid: boolean
    from: ISOMonth
  } | null>(null)

  const focusInGrid = () => {
    const root = gridRef.current?.getRootNode() as Document | ShadowRoot | null
    const active = root?.activeElement
    return !!active && !!gridRef.current?.contains(active)
  }
  // True when focus fell out of the document entirely (disable-blur or
  // unmount drops it to body) rather than landing on a real target —
  // the only case where rebuilding grid focus cannot steal (CA-KEY-10).
  const focusLostToBody = () => {
    const root = gridRef.current?.getRootNode() as Document | ShadowRoot | null
    const active = root?.activeElement ?? null
    return active === null || active === (root as Document).body
  }
  // Grid-owned focus across synchronous browser drops: disabling or
  // unmounting the focused day blurs to body/null *during* the commit,
  // before effects run, so the live check alone would miss it. A blur
  // onto a real outside target clears the flag; a null-target blur
  // (disable/unmount — or a dead-space click, the accepted corner)
  // keeps the last value.
  const hadGridFocusRef = React.useRef(false)
  const focusDay = (date: ISODate) => {
    // Owner-root-safe: query inside the grid element, never the
    // document, so Shadow DOM keeps working (CA-ENV-03).
    gridRef.current?.querySelector<HTMLButtonElement>(`button[data-date="${date}"]`)?.focus()
  }

  // Grid identity across commits: a rebuild (month/locale change) may
  // replace the focused day's node while its ISO stays the tab target.
  const prevGridRef = React.useRef<MonthGrid | null>(null)

  React.useEffect(() => {
    const gridChanged = prevGridRef.current !== grid
    prevGridRef.current = grid
    if (gridChanged) {
      // The pane rebuilt under a possibly stationary pointer: the hover
      // candidate may be gone or rebound, so drop it (fresh mouse events
      // re-establish it). Never Tab-commit to a stale date.
      onGridRebuilt()
    }
    const pending = pendingFocusRef.current
    if (pending) {
      const pendingMonth = pending.date.slice(0, 7)
      if (pendingMonth !== showingMonth) {
        if (showingMonth !== pending.from) {
          // The pane moved elsewhere while the request was pending → the
          // target is stale; drop it (CA-KEY-10 programmatic-month case).
          pendingFocusRef.current = null
        } else {
          // Still waiting on the parent (CA-KEY-07): the target may
          // already be visible as padding, but focus stays on the origin
          // until the month commits. Keep the tab target valid meanwhile.
          if (focusedDate && renderedSet.has(focusedDate) && !isDisabled(focusedDate)) return
          const next =
            focusedDate && renderedSet.has(focusedDate)
              ? nearestFocusableTarget(renderedDays, focusedDate, isDisabled)
              : computePreferredTarget(renderedDays, isDisabled, isSelected, markerToday)
          if (next !== focusedDate) setFocusedDate(next)
          return
        }
      } else if (renderedSet.has(pending.date) && !isDisabled(pending.date)) {
        pendingFocusRef.current = null
        setFocusedDate(pending.date)
        if (pending.focusWasInGrid) focusDay(pending.date)
        return
      } else {
        // Committed but unusable (out of bounds/removed) → drop and
        // relocate to one valid tab target without stealing focus
        // (CA-KEY-10). Unavailable targets stay usable.
        pendingFocusRef.current = null
      }
    }
    if (focusedDate && renderedSet.has(focusedDate) && !isDisabled(focusedDate)) {
      // Valid target, but a rebuild may have dropped its node: repair
      // grid-owned DOM focus only when it fell to body (CA-LOC-07).
      if (gridChanged && hadGridFocusRef.current && !focusInGrid() && focusLostToBody()) {
        focusDay(focusedDate)
      }
      return
    }
    // Out of bounds in place → nearest (CA-DYNAMIC-02); unrendered (month
    // or locale moved on) → preferred target (CA-DYNAMIC-03, CA-LOC-07).
    // DOM focus follows only when it was grid-owned: live in the grid,
    // or dropped by the same commit's disable/unmount.
    const next =
      focusedDate && renderedSet.has(focusedDate)
        ? nearestFocusableTarget(renderedDays, focusedDate, isDisabled)
        : computePreferredTarget(renderedDays, isDisabled, isSelected, markerToday)
    if (next !== focusedDate) {
      setFocusedDate(next)
      if (next && (focusInGrid() || hadGridFocusRef.current)) focusDay(next)
    }
  })

  return {
    gridRef,
    focusedDate,
    setFocusedDate,
    pendingFocusRef,
    hadGridFocusRef,
    focusDay,
    focusInGrid,
  }
}
