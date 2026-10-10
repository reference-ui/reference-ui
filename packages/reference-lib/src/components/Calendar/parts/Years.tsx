/**
 * Years part: the 3-column year collection for the private year view and
 * year mode, windowed around the shown year (or the bound years when
 * set). Arrows move focus without selecting, activation is a native
 * button click, and the current in-range year scrolls into view when the
 * collection opens.
 */
import * as React from 'react'
import { Button, Div } from '@reference-ui/react'
import { computePreferredCell, nearestEnabledCell } from '../collections/roving'
import { resolveYearWindow } from '../collections/year-window'
import { CalendarContext } from '../context'
import { formatISOYear, type ISOYear } from '../dates/iso'
import { yearRangePaint } from '../selection/paints'
import { collectionKeyDelta } from '../shared/collection-keys'
import type { CalendarYearsProps } from '../types'

interface YearCellData {
  year: ISOYear
  yearNum: number
  current: boolean
  selected: boolean
  disabled: boolean
  rangeStart: boolean
  rangeEnd: boolean
  inRange: boolean
}

export function CalendarYears({
  className,
  style,
  ref: consumerRef,
  onKeyDown: consumerOnKeyDown,
  ...props
}: CalendarYearsProps) {
  const context = React.useContext(CalendarContext)
  if (!context) return null
  const { view, currentMonth, mode, value, min, max, selectYear, isYearDisabled } = context

  const containerRef = React.useRef<HTMLDivElement>(null)
  const setContainerRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node
      if (typeof consumerRef === 'function') {
        consumerRef(node)
      } else if (consumerRef && typeof consumerRef === 'object') {
        ;(consumerRef as React.RefObject<HTMLDivElement | null>).current = node
      }
    },
    [consumerRef]
  )

  const year = currentMonth.year

  // Year window (CA-VIEW-06): ten either side of the shown year unbounded
  // (clamped to keep 21 in-domain at 0001/9999); min-through-max years
  // when both bounds exist; a 21-year run reaching from the single bound
  // toward the shown year otherwise.
  const years = React.useMemo<YearCellData[]>(() => {
    const { startYear, endYear } = resolveYearWindow(year, min, max)
    const cells: YearCellData[] = []
    for (let y = startYear; y <= endYear; y++) {
      const yearStr = formatISOYear(y)
      const paint =
        mode === 'year'
          ? {
              selected: value === yearStr,
              rangeStart: false,
              rangeEnd: false,
              inRange: false,
            }
          : mode === 'range'
            ? yearRangePaint(y, value)
            : { selected: false, rangeStart: false, rangeEnd: false, inRange: false }
      cells.push({
        year: yearStr,
        yearNum: y,
        current: y === year,
        selected: paint.selected,
        disabled: isYearDisabled(yearStr),
        rangeStart: paint.rangeStart,
        rangeEnd: paint.rangeEnd,
        inRange: paint.inRange,
      })
    }
    return cells
  }, [year, min, max, mode, value, isYearDisabled])

  // The current in-range year scrolls into view when the collection opens.
  React.useEffect(() => {
    if (view === 'year' && containerRef.current) {
      containerRef.current
        .querySelector<HTMLElement>(`[data-reference-calendar-year-cell][data-year="${formatISOYear(year)}"]`)
        ?.scrollIntoView?.({ block: 'nearest' })
    }
  }, [view, year])

  const computePreferredYear = React.useCallback((): ISOYear | null => {
    const cells = years.map((cell) => ({
      key: cell.year,
      disabled: cell.disabled,
      selected: cell.selected,
      current: cell.current,
    }))
    return computePreferredCell(cells) as ISOYear | null
  }, [years])

  const [focusedYear, setFocusedYear] = React.useState<ISOYear | null>(computePreferredYear)

  const renderedYears = React.useMemo(() => new Set(years.map((cell) => cell.year)), [years])

  const nearestEnabledYear = React.useCallback(
    (origin: ISOYear): ISOYear | null => {
      const cells = years.map((cell) => ({
        key: cell.year,
        disabled: cell.disabled,
        selected: cell.selected,
        current: cell.current,
      }))
      return nearestEnabledCell(cells, origin) as ISOYear | null
    },
    [years]
  )

  const focusInContainer = () => {
    const root = containerRef.current?.getRootNode() as Document | ShadowRoot | null
    const active = root?.activeElement
    return !!active && !!containerRef.current?.contains(active)
  }
  const focusYear = (yearStr: ISOYear) => {
    containerRef.current
      ?.querySelector<HTMLButtonElement>(`button[data-year="${yearStr}"]`)
      ?.focus()
  }

  React.useEffect(() => {
    if (focusedYear && renderedYears.has(focusedYear) && !isYearDisabled(focusedYear)) {
      return
    }
    const next =
      focusedYear && renderedYears.has(focusedYear)
        ? nearestEnabledYear(focusedYear)
        : computePreferredYear()
    if (next !== focusedYear) {
      setFocusedYear(next)
      if (next && focusInContainer()) focusYear(next)
    }
  })

  const handleYearsKeyDown = (event: React.KeyboardEvent) => {
    if (event.defaultPrevented) return // consumer Years onKeyDown ran first
    if (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return
    const target = event.target as HTMLElement | null
    const cell = target?.closest?.('button[data-year]') ?? null
    if (!cell || !containerRef.current?.contains(cell)) return
    // Activation is native button click (Enter/Space untouched). Arrows
    // move focus in the 3-column field without selecting (CA-VIEW-10);
    // the target must exist in the window or the gesture is a no-op.
    const dirTarget =
      target?.closest?.('[dir]')?.getAttribute('dir') ??
      event.currentTarget.ownerDocument?.documentElement?.getAttribute('dir')
    const delta = collectionKeyDelta(event.key, dirTarget === 'rtl')
    if (delta === null) return
    const origin = parseInt(cell.getAttribute('data-year') as string, 10)
    const candidate = origin + delta
    if (candidate < 1 || candidate > 9999) return
    const next = formatISOYear(candidate)
    if (!renderedYears.has(next)) return
    event.preventDefault()
    setFocusedYear(next)
    focusYear(next)
  }

  const handleYearClick = (cell: YearCellData) => {
    if (cell.disabled) return
    setFocusedYear(cell.year) // the roving target follows activation
    selectYear(cell.year)
  }

  return (
    <Div
      ref={setContainerRef}
      data-reference-calendar-years=""
      gridTemplateColumns="repeat(3, 1fr)"
      gap="2r"
      p="2r"
      maxH="60r"
      overflowY="auto"
      onKeyDown={(event) => {
        consumerOnKeyDown?.(event)
        handleYearsKeyDown(event)
      }}
      className={className}
      style={{ display: view === 'year' ? undefined : 'none', ...style }}
      {...props}
    >
      {years.map((cell) => {
        const isFocused = focusedYear === cell.year
        return (
          <Button
            key={cell.year}
            type="button"
            data-reference-calendar-year-cell=""
            data-year={cell.year}
            tabIndex={isFocused && view === 'year' ? 0 : -1}
            disabled={cell.disabled}
            aria-disabled={cell.disabled ? 'true' : undefined}
            data-current={cell.current ? '' : undefined}
            data-selected={cell.selected ? '' : undefined}
            data-disabled={cell.disabled ? '' : undefined}
            data-range-start={cell.rangeStart ? '' : undefined}
            data-range-end={cell.rangeEnd ? '' : undefined}
            data-in-range={cell.inRange ? '' : undefined}
            data-focused={isFocused ? '' : undefined}
            onClick={() => handleYearClick(cell)}
            p="2r"
            borderRadius="sm"
            border="none"
            bg={cell.selected ? 'ui.button.background' : 'transparent'}
            color={
              cell.selected
                ? 'ui.button.foreground'
                : cell.disabled
                  ? 'design.text.light'
                  : 'design.text.base'
            }
            fontSize="3r"
            fontWeight={cell.selected || cell.current ? '600' : '400'}
            textDecoration={cell.current ? 'underline' : undefined}
            textUnderlineOffset={cell.current ? '0.15em' : undefined}
            cursor={cell.disabled ? 'not-allowed' : 'pointer'}
            outline="none"
            _hover={!cell.selected && !cell.disabled ? { bg: 'ui.button.mutedBackground' } : undefined}
            _focusVisible={{ outline: '2px solid', outlineColor: 'ui.focus.ring', outlineOffset: '2px' }}
          >
            {cell.yearNum}
          </Button>
        )
      })}
    </Div>
  )
}
