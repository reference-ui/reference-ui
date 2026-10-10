/**
 * Months part: the 3-column month collection for the private month view
 * and month mode. Arrows move focus without selecting, activation is a
 * native button click, and the roving target prefers the enabled
 * selection, then the enabled current month, then the first enabled
 * month — null when the whole year is blocked.
 */
import * as React from 'react'
import { Button, Div } from '@reference-ui/react'
import { computePreferredCell, nearestEnabledCell } from '../collections/roving'
import { CalendarContext } from '../context'
import { formatISOMonth, parseISOMonth, type ISOMonth } from '../dates/iso'
import { monthRangePaint } from '../selection/paints'
import { collectionKeyDelta } from '../shared/collection-keys'
import { formatShortMonth } from '../shared/format'
import type { CalendarMonthsProps } from '../types'

interface MonthCellData {
  month: ISOMonth
  label: string
  current: boolean
  selected: boolean
  disabled: boolean
  rangeStart: boolean
  rangeEnd: boolean
  inRange: boolean
}

export function CalendarMonths({
  className,
  style,
  ref: consumerRef,
  onKeyDown: consumerOnKeyDown,
  ...props
}: CalendarMonthsProps) {
  const context = React.useContext(CalendarContext)
  if (!context) return null
  const { view, currentMonth, locale, mode, value, selectMonth, isMonthDisabled } = context

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
  const showingMonth = formatISOMonth(year, currentMonth.month + 1)

  const months = React.useMemo<MonthCellData[]>(() => {
    const cells: MonthCellData[] = []
    for (let m = 1; m <= 12; m++) {
      const monthStr = formatISOMonth(year, m)
      const paint =
        mode === 'month'
          ? {
              selected: value === monthStr,
              rangeStart: false,
              rangeEnd: false,
              inRange: false,
            }
          : mode === 'range'
            ? monthRangePaint(monthStr, value)
            : { selected: false, rangeStart: false, rangeEnd: false, inRange: false }
      cells.push({
        month: monthStr,
        label: formatShortMonth(locale, year, m - 1),
        current: monthStr === showingMonth,
        selected: paint.selected,
        disabled: isMonthDisabled(monthStr),
        rangeStart: paint.rangeStart,
        rangeEnd: paint.rangeEnd,
        inRange: paint.inRange,
      })
    }
    return cells
  }, [year, showingMonth, locale, mode, value, isMonthDisabled])

  // Roving target: enabled selection, else the enabled current month,
  // else the first enabled month. Null when the whole year is blocked —
  // no artificial tab stop.
  const computePreferredMonth = React.useCallback((): ISOMonth | null => {
    const cells = months.map((cell) => ({
      key: cell.month,
      disabled: cell.disabled,
      selected: cell.selected,
      current: cell.current,
    }))
    return computePreferredCell(cells) as ISOMonth | null
  }, [months])

  const [focusedMonth, setFocusedMonth] = React.useState<ISOMonth | null>(computePreferredMonth)

  const nearestEnabledMonth = React.useCallback(
    (origin: ISOMonth): ISOMonth | null => {
      const cells = months.map((cell) => ({
        key: cell.month,
        disabled: cell.disabled,
        selected: cell.selected,
        current: cell.current,
      }))
      return nearestEnabledCell(cells, origin) as ISOMonth | null
    },
    [months]
  )

  const isMonthRendered = (month: ISOMonth) => parseISOMonth(month).year === year

  const focusInContainer = () => {
    const root = containerRef.current?.getRootNode() as Document | ShadowRoot | null
    const active = root?.activeElement
    return !!active && !!containerRef.current?.contains(active)
  }
  const focusMonth = (month: ISOMonth) => {
    containerRef.current
      ?.querySelector<HTMLButtonElement>(`button[data-month="${month}"]`)
      ?.focus()
  }

  React.useEffect(() => {
    if (
      focusedMonth &&
      isMonthRendered(focusedMonth) &&
      !isMonthDisabled(focusedMonth)
    ) {
      return
    }
    const next =
      focusedMonth && isMonthRendered(focusedMonth)
        ? nearestEnabledMonth(focusedMonth)
        : computePreferredMonth()
    if (next !== focusedMonth) {
      setFocusedMonth(next)
      if (next && focusInContainer()) focusMonth(next)
    }
  })

  const handleMonthsKeyDown = (event: React.KeyboardEvent) => {
    if (event.defaultPrevented) return // consumer Months onKeyDown ran first
    if (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return
    const target = event.target as HTMLElement | null
    const cell = target?.closest?.('button[data-month]') ?? null
    if (!cell || !containerRef.current?.contains(cell)) return
    // Activation is native button click (Enter/Space untouched, the
    // CA-SINGLE-02 day-grid rule — no synthetic double-fire). Arrows move
    // focus in the 3-column field without selecting (CA-VIEW-10).
    const dirTarget =
      target?.closest?.('[dir]')?.getAttribute('dir') ??
      event.currentTarget.ownerDocument?.documentElement?.getAttribute('dir')
    const delta = collectionKeyDelta(event.key, dirTarget === 'rtl')
    if (delta === null) return
    const origin = cell.getAttribute('data-month') as ISOMonth
    const nextM = parseISOMonth(origin).month + delta
    if (nextM < 1 || nextM > 12) return
    event.preventDefault()
    const next = formatISOMonth(year, nextM)
    setFocusedMonth(next)
    // A disabled target keeps native focus where it is (focus() on a
    // disabled button is a no-op); activation stays guarded regardless.
    focusMonth(next)
  }

  const handleMonthClick = (cell: MonthCellData) => {
    if (cell.disabled) return
    setFocusedMonth(cell.month) // the roving target follows activation
    selectMonth(cell.month)
  }

  return (
    <Div
      ref={setContainerRef}
      data-reference-calendar-months=""
      gridTemplateColumns="repeat(3, 1fr)"
      gap="2r"
      p="2r"
      onKeyDown={(event) => {
        consumerOnKeyDown?.(event)
        handleMonthsKeyDown(event)
      }}
      className={className}
      style={{ display: view === 'month' ? undefined : 'none', ...style }}
      {...props}
    >
      {months.map((cell) => {
        const isFocused = focusedMonth === cell.month
        return (
          <Button
            key={cell.month}
            type="button"
            data-reference-calendar-month-cell=""
            data-month={cell.month}
            tabIndex={isFocused && view === 'month' ? 0 : -1}
            disabled={cell.disabled}
            aria-disabled={cell.disabled ? 'true' : undefined}
            data-current={cell.current ? '' : undefined}
            data-selected={cell.selected ? '' : undefined}
            data-disabled={cell.disabled ? '' : undefined}
            data-range-start={cell.rangeStart ? '' : undefined}
            data-range-end={cell.rangeEnd ? '' : undefined}
            data-in-range={cell.inRange ? '' : undefined}
            data-focused={isFocused ? '' : undefined}
            onClick={() => handleMonthClick(cell)}
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
            {cell.label}
          </Button>
        )
      })}
    </Div>
  )
}
