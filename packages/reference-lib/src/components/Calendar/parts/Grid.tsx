/**
 * Grid part: the day table owning focus, preview, and activation while
 * Weekdays, Days, and Day render from its section context. Roving focus,
 * the pending cross-month request, keyboard moves, Tab-commit, and the
 * resolved per-date models compose here; authored Weekdays/Days replace
 * their default per part, and anything else is dropped so the table
 * holds only thead/tbody.
 */
import * as React from 'react'
import { Table } from '@reference-ui/react'
import { CalendarContext, GridSectionContext, type GridSectionContextValue } from '../context'
import { formatISOMonth, type ISOMonth } from '../dates/iso'
import type { GridDay } from '../dates/grid'
import { resolveDayModels } from '../day-grid/models'
import { resolvePreviewBand } from '../day-grid/preview'
import { useGridFocus } from '../hooks/use-grid-focus'
import {
  resolveArrowTarget,
  resolveHomeEndTarget,
  resolvePageTarget,
} from '../navigation/moves'
import { isPartElement } from '../shared/elements'
import type { CalendarGridProps, ISODate } from '../types'
import { CalendarDays } from './Days'
import { CalendarWeekdays } from './Weekdays'

export function CalendarGrid({
  children,
  className,
  style,
  ref: consumerRef,
  onKeyDown: consumerOnKeyDown,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...props
}: CalendarGridProps) {
  const context = React.useContext(CalendarContext)
  if (!context) return null

  const {
    mode,
    view,
    value,
    currentMonth,
    grid,
    headingId,
    idPrefix,
    markerToday,
    weekStart,
    min,
    max,
    requestMonthChange,
    selectDate,
    isDateSelected,
    isDateSelectedInclusive,
    isDateInRange,
    isDateInRangeInclusive,
    isRangeStart,
    isRangeEnd,
    isDateDisabled,
    isDateUnavailableDay,
    isDateUnselectable,
    dayRender,
  } = context

  // Padding past the 0001/9999 domain edge is not a date: void cells stay
  // empty so the predicate only ever sees valid canonical in-domain
  // strings (CA-STATE-05) and no out-of-domain value can escape (CA-ISO-08).
  const renderedDays = React.useMemo(
    () => grid.allDays.filter((cell) => cell.year >= 1 && cell.year <= 9999),
    [grid]
  )
  const renderedSet = React.useMemo(
    () => new Set<string>(renderedDays.map((cell) => cell.date)),
    [renderedDays]
  )
  const cellByDate = React.useMemo(
    () => new Map<ISODate, GridDay>(renderedDays.map((cell) => [cell.date, cell])),
    [renderedDays]
  )

  // Range preview candidates (FEATURES #9): the hovered day, else the
  // grid-focused day. Hover wins while the pointer is over a day;
  // keyboard focus drives preview once hover clears (CA-RANGE-02).
  const [hoverDate, setHoverDate] = React.useState<ISODate | null>(null)
  const [focusPreviewDate, setFocusPreviewDate] = React.useState<ISODate | null>(null)

  // Valid preview band (FEATURES #9): range mode with a controlled
  // pending start, a candidate that is not the start, selectable, and
  // whose inclusive span holds no unselectable date. Anything else —
  // completed/null value, degenerate, disabled endpoint, blocked span —
  // previews nothing (CA-RANGE-02/07/10/13). The band is anchor-oriented:
  // the start keeps range-start, the candidate takes range-end, and the
  // completion normalizes to chronological (CA-RANGE-05).
  const previewBand = React.useMemo(
    () => resolvePreviewBand(mode, value, hoverDate ?? focusPreviewDate, isDateUnselectable),
    [mode, value, hoverDate, focusPreviewDate, isDateUnselectable]
  )

  const showingMonth = formatISOMonth(currentMonth.year, currentMonth.month + 1)

  const {
    gridRef,
    focusedDate,
    setFocusedDate,
    pendingFocusRef,
    hadGridFocusRef,
    focusDay,
    focusInGrid,
  } = useGridFocus({
    grid,
    renderedDays,
    renderedSet,
    isDisabled: isDateDisabled,
    isSelected: isDateSelected,
    markerToday,
    showingMonth,
    onGridRebuilt: () => setHoverDate(null),
  })

  const setGridRef = React.useCallback(
    (node: HTMLTableElement | null) => {
      gridRef.current = node
      if (typeof consumerRef === 'function') {
        consumerRef(node)
      } else if (consumerRef && typeof consumerRef === 'object') {
        ;(consumerRef as React.RefObject<HTMLTableElement | null>).current = node
      }
    },
    // gridRef is a stable ref object from the focus hook.
    [gridRef, consumerRef]
  )

  const handleGridFocusCapture = (event: React.FocusEvent) => {
    if (gridRef.current?.contains(event.target as Node)) hadGridFocusRef.current = true
  }
  const handleGridBlurCapture = (event: React.FocusEvent) => {
    const related = event.relatedTarget as Node | null
    if (related && gridRef.current?.contains(related)) return
    if (related) hadGridFocusRef.current = false
    // Focus left the grid: the focus-driven preview ends. A rejected
    // Tab-commit still retains its controlled pending start (CA-RANGE-14).
    setFocusPreviewDate(null)
  }

  const handleGridKeyDown = (event: React.KeyboardEvent) => {
    if (event.defaultPrevented) return // consumer Grid onKeyDown ran first
    const target = event.target as HTMLElement | null
    const dayButton = target?.closest?.('button[data-date]') ?? null
    if (!dayButton || !gridRef.current?.contains(dayButton)) return
    const origin = dayButton.getAttribute('data-date') as ISODate
    const key = event.key
    if (key === 'Tab') {
      // Tab-commit (FEATURES #9, CA-RANGE-14): a valid pending preview
      // completes when Tab leaves the grid — Shift+Tab leaves too, so it
      // commits the same way. Never default-prevented: the request fires
      // on keydown, native focus settles after. An invalid preview emits
      // nothing; rejection just ends the transient band on blur.
      if (previewBand) selectDate(previewBand.candidate)
      return
    }
    if (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return // CA-KEY-04
    const horizontal = key === 'ArrowLeft' || key === 'ArrowRight'
    const vertical = key === 'ArrowUp' || key === 'ArrowDown'
    if (
      !horizontal &&
      !vertical &&
      key !== 'Home' &&
      key !== 'End' &&
      key !== 'PageUp' &&
      key !== 'PageDown'
    ) {
      return
    }
    // Inherited RTL reverses only the visual horizontal keys (CA-LOC-06);
    // time itself never reverses.
    const dirTarget =
      target?.closest?.('[dir]')?.getAttribute('dir') ??
      event.currentTarget.ownerDocument?.documentElement?.getAttribute('dir')
    const rtl = dirTarget === 'rtl'
    const minBound = (min ?? '0001-01-01') as ISODate
    const maxBound = (max ?? '9999-12-31') as ISODate

    let candidate: ISODate | null = null
    if (horizontal || vertical) {
      candidate = resolveArrowTarget(origin, key, rtl, minBound, maxBound, isDateDisabled)
    } else if (key === 'Home' || key === 'End') {
      // Locale week boundary (CA-KEY-02); out-of-bounds boundary dates
      // skip inward toward the origin week interior. Unavailable
      // boundaries are landing spots (W-21).
      candidate = resolveHomeEndTarget(origin, key, weekStart, isDateDisabled)
    } else {
      // Adjacent month preserving the day when possible, constrained at
      // month end (CA-KEY-03); focus applies after the month commits.
      candidate = resolvePageTarget(
        origin,
        key === 'PageUp' ? -1 : 1,
        minBound,
        maxBound,
        isDateDisabled
      )
    }

    event.preventDefault() // handled keys never scroll (CA-KEY-01)
    if (!candidate || candidate === origin) return
    // Movement changes only focus and, when necessary, the requested
    // month — never selection (CA-KEY-08).
    if (candidate.slice(0, 7) === showingMonth) {
      setFocusedDate(candidate)
      focusDay(candidate)
    } else {
      pendingFocusRef.current = { date: candidate, focusWasInGrid: focusInGrid(), from: showingMonth }
      requestMonthChange(candidate.slice(0, 7) as ISOMonth)
    }
  }

  const handleDayClick = (date: ISODate) => {
    const cell = cellByDate.get(date)
    if (!cell) return
    if (isDateUnselectable(cell.date)) return // locked out in every modality (CA-SINGLE-04)
    if (cell.outsideMonth) {
      // Outside activation requests the month first, then the date
      // (CA-SINGLE-07); focus survives month acceptance (CA-MONTH-07).
      pendingFocusRef.current = {
        date: cell.date,
        focusWasInGrid: focusInGrid(),
        from: showingMonth,
      }
      requestMonthChange(formatISOMonth(cell.year, cell.month))
    }
    setFocusedDate(cell.date) // the roving target follows activation (CA-SINGLE-01)
    selectDate(cell.date)
  }

  // Resolved per-date models for the sections (FEATURES #5): the exact
  // ten-field render state plus DOM/paint derivations, computed once per
  // date so Days and Day can never disagree.
  const dayModels = React.useMemo(
    () =>
      resolveDayModels({
        renderedDays,
        isSelected: isDateSelected,
        isSelectedInclusive: isDateSelectedInclusive,
        isInRange: isDateInRange,
        isInRangeInclusive: isDateInRangeInclusive,
        isRangeStart,
        isRangeEnd,
        isDisabled: isDateDisabled,
        isUnavailableDay: isDateUnavailableDay,
        previewBand,
        markerToday,
        focusedDate,
        dayRender,
        view,
        idPrefix,
      }),
    [
      renderedDays,
      isDateSelected,
      isDateSelectedInclusive,
      isDateInRange,
      isDateInRangeInclusive,
      isRangeStart,
      isRangeEnd,
      isDateDisabled,
      isDateUnavailableDay,
      previewBand,
      markerToday,
      focusedDate,
      dayRender,
      view,
      idPrefix,
    ]
  )

  const getModel = React.useCallback(
    (date: ISODate) => dayModels.get(date) ?? null,
    [dayModels]
  )

  // Deliberately unmemoized: the sections re-render with the Grid
  // either way, and the click closure reads fresh focus helpers.
  const sectionValue: GridSectionContextValue = {
    weeks: grid.weeks,
    getModel,
    onDayClick: handleDayClick,
    onDayFocus: (date: ISODate) => setFocusPreviewDate(date),
    onDayMouseEnter: (date: ISODate) => setHoverDate(date),
    onDayMouseLeave: () => setHoverDate(null),
  }

  // Authored sections replace their default per part; anything else is
  // dropped — a table holds only thead/tbody (CA-GRID-11 validity).
  const sections = React.useMemo(() => {
    let weekdays: React.ReactElement | undefined
    let days: React.ReactElement | undefined
    const collect = (nodes: React.ReactNode): void => {
      React.Children.forEach(nodes, (child) => {
        if (isPartElement(child, React.Fragment)) {
          collect((child.props as { children?: React.ReactNode }).children)
        } else if (isPartElement(child, CalendarWeekdays)) {
          weekdays ??= child
        } else if (isPartElement(child, CalendarDays)) {
          days ??= child
        }
      })
    }
    collect(children)
    return { weekdays, days }
  }, [children])

  return (
    <Table
      ref={setGridRef}
      role="grid"
      data-reference-calendar-grid=""
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy ?? (ariaLabel ? undefined : headingId)}
      onKeyDown={(event) => {
        consumerOnKeyDown?.(event)
        handleGridKeyDown(event)
      }}
      onFocusCapture={handleGridFocusCapture}
      onBlurCapture={handleGridBlurCapture}
      borderCollapse="collapse"
      tableLayout="fixed"
      width="100%"
      textAlign="center"
      className={className}
      // One collection is ever shown: display:none drops the day table
      // from the accessibility tree and tab order in month/year view
      // (CA-VIEW-01/04) while keeping grid state across toggles.
      style={{ display: view === 'day' ? undefined : 'none', ...style }}
      {...props}
    >
      <GridSectionContext.Provider value={sectionValue}>
        {sections.weekdays ?? <CalendarWeekdays />}
        {sections.days ?? <CalendarDays />}
      </GridSectionContext.Provider>
    </Table>
  )
}
