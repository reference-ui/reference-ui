import * as React from 'react'
import {
  Div,
  H2,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  type PrimitiveProps,
  type PrimitiveElement,
} from '@reference-ui/react'

export type CalendarMode = 'day' | 'range' | 'month' | 'year'
export type ISODate = string // YYYY-MM-DD
export interface DateRangeValue {
  start: ISODate | null
  end: ISODate | null
}

export type CalendarProps = Omit<PrimitiveProps<'div'>, 'onChange' | 'value' | 'defaultValue'> & {
  mode?: CalendarMode
  value?: ISODate | DateRangeValue | null
  defaultValue?: ISODate | DateRangeValue | null
  onChange?: (value: any) => void
  locale?: string
  month?: string // YYYY-MM
  onMonthChange?: (month: string) => void
  min?: ISODate
  max?: ISODate
  disabled?: boolean
}

interface CalendarContextValue {
  mode: CalendarMode
  value: ISODate | DateRangeValue | null
  currentMonth: { year: number; month: number }
  locale: string
  disabled: boolean
  viewMode: 'day' | 'month'
  toggleViewMode: () => void
  selectMonth: (monthIndex: number) => void
  goToPrevMonth: () => void
  goToNextMonth: () => void
  selectDate: (dateStr: ISODate) => void
  isDateSelected: (dateStr: ISODate) => boolean
  isDateInRange: (dateStr: ISODate) => boolean
  isRangeStart: (dateStr: ISODate) => boolean
  isRangeEnd: (dateStr: ISODate) => boolean
}

const CalendarContext = React.createContext<CalendarContextValue | null>(null)

export type CalendarHeaderProps = PrimitiveProps<'div'>

export function CalendarHeader({
  children,
  className,
  style,
  ...props
}: CalendarHeaderProps) {
  return (
    <Div
      data-reference-calendar-header=""
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      mb="2r"
      className={className}
      style={style}
      {...props}
    >
      {children}
    </Div>
  )
}

export type CalendarHeadingProps = PrimitiveProps<'button'>

export function CalendarHeading({
  className,
  style,
  ...props
}: CalendarHeadingProps) {
  const context = React.useContext(CalendarContext)
  if (!context) return null

  const { currentMonth, locale, toggleViewMode, viewMode } = context
  const date = new Date(Date.UTC(currentMonth.year, currentMonth.month, 1))
  const monthName = date.toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

  return (
    <Button
      type="button"
      data-reference-calendar-heading=""
      onClick={toggleViewMode}
      bg="transparent"
      border="none"
      p="1r 2r"
      borderRadius="sm"
      cursor="pointer"
      fontSize="4r"
      fontWeight="600"
      m="0"
      color="design.text.base"
      display="inline-flex"
      alignItems="center"
      gap="1r"
      _hover={{ bg: 'ui.button.mutedBackground' }}
      className={className}
      style={style}
      {...props}
    >
      <span>{monthName}</span>
      <span style={{ fontSize: '0.65em', opacity: 0.6 }}>{viewMode === 'month' ? '▲' : '▼'}</span>
    </Button>
  )
}

export type CalendarPrevButtonProps = PrimitiveProps<'button'>

export function CalendarPrevButton({
  children = '‹',
  className,
  style,
  onClick,
  ...props
}: CalendarPrevButtonProps) {
  const context = React.useContext(CalendarContext)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (!e.defaultPrevented) {
      context?.goToPrevMonth()
    }
  }

  return (
    <Button
      type="button"
      aria-label="Previous month"
      disabled={context?.disabled}
      onClick={handleClick}
      width="7r"
      height="7r"
      p="0"
      borderRadius="sm"
      border="none"
      bg="transparent"
      color="design.text.base"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      cursor={context?.disabled ? 'not-allowed' : 'pointer'}
      _hover={!context?.disabled ? { bg: 'ui.button.mutedBackground' } : undefined}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </Button>
  )
}

export type CalendarNextButtonProps = PrimitiveProps<'button'>

export function CalendarNextButton({
  children = '›',
  className,
  style,
  onClick,
  ...props
}: CalendarNextButtonProps) {
  const context = React.useContext(CalendarContext)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (!e.defaultPrevented) {
      context?.goToNextMonth()
    }
  }

  return (
    <Button
      type="button"
      aria-label="Next month"
      disabled={context?.disabled}
      onClick={handleClick}
      width="7r"
      height="7r"
      p="0"
      borderRadius="sm"
      border="none"
      bg="transparent"
      color="design.text.base"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      cursor={context?.disabled ? 'not-allowed' : 'pointer'}
      _hover={!context?.disabled ? { bg: 'ui.button.mutedBackground' } : undefined}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </Button>
  )
}

export type CalendarGridProps = PrimitiveProps<'table'>

export function CalendarGrid({
  className,
  style,
  ...props
}: CalendarGridProps) {
  const context = React.useContext(CalendarContext)
  if (!context) return null

  const {
    currentMonth,
    selectDate,
    selectMonth,
    isDateSelected,
    isDateInRange,
    isRangeStart,
    isRangeEnd,
    disabled,
    viewMode,
  } = context

  if (viewMode === 'month') {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ]
    return (
      <Div
        data-reference-calendar-month-grid=""
        display="grid"
        gridTemplateColumns="repeat(3, 1fr)"
        gap="2r"
        py="2r"
        className={className}
        style={style}
        {...props}
      >
        {monthNames.map((mName, i) => {
          const isCurrent = i === currentMonth.month
          return (
            <Button
              key={mName}
              type="button"
              onClick={() => selectMonth(i)}
              p="2.5r 1r"
              borderRadius="sm"
              border="none"
              bg={isCurrent ? 'ui.button.background' : 'transparent'}
              color={isCurrent ? 'ui.button.foreground' : 'design.text.base'}
              fontWeight={isCurrent ? '600' : '400'}
              fontSize="3.5r"
              cursor="pointer"
              _hover={!isCurrent ? { bg: 'ui.button.mutedBackground' } : undefined}
            >
              {mName}
            </Button>
          )
        })}
      </Div>
    )
  }

  const { year, month } = currentMonth

  // Generate days in month
  const firstDayOfWeek = new Date(Date.UTC(year, month, 1)).getUTCDay()
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()

  const weeks: Array<Array<{ dateStr: string; dayNum: number; inMonth: boolean }>> = []
  let currentWeek: Array<{ dateStr: string; dayNum: number; inMonth: boolean }> = []

  // Prepend empty slots / previous month days
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push({ dateStr: '', dayNum: 0, inMonth: false })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const padMonth = String(month + 1).padStart(2, '0')
    const padDay = String(d).padStart(2, '0')
    const dateStr = `${year}-${padMonth}-${padDay}`

    currentWeek.push({ dateStr, dayNum: d, inMonth: true })

    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ dateStr: '', dayNum: 0, inMonth: false })
    }
    weeks.push(currentWeek)
  }

  const weekDayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  return (
    <Table
      role="grid"
      data-reference-calendar-grid=""
      borderCollapse="collapse"
      tableLayout="fixed"
      width="100%"
      textAlign="center"
      className={className}
      style={style}
      {...props}
    >
      <Thead>
        <Tr role="row">
          {weekDayNames.map((wd, i) => (
            <Th
              key={i}
              role="columnheader"
              fontSize="3r"
              color="design.text.light"
              p="1r 0"
              fontWeight="500"
            >
              {wd}
            </Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        {weeks.map((week, wIdx) => (
          <Tr key={wIdx} role="row">
            {week.map((cell, cIdx) => {
              if (!cell.inMonth) {
                return <Td key={cIdx} role="gridcell" p="0.5r 0" />
              }

              const selected = isDateSelected(cell.dateStr)
              const inRange = isDateInRange(cell.dateStr)
              const rangeStart = isRangeStart(cell.dateStr)
              const rangeEnd = isRangeEnd(cell.dateStr)

              return (
                <Td
                  key={cIdx}
                  role="gridcell"
                  p="0.5r 0"
                  textAlign="center"
                  bg={inRange ? 'ui.table.row.mutedBackground' : undefined}
                  borderTopLeftRadius={rangeStart ? 'full' : undefined}
                  borderBottomLeftRadius={rangeStart ? 'full' : undefined}
                  borderTopRightRadius={rangeEnd ? 'full' : undefined}
                  borderBottomRightRadius={rangeEnd ? 'full' : undefined}
                >
                  <Button
                    type="button"
                    role="gridcell"
                    tabIndex={selected ? 0 : -1}
                    aria-selected={selected}
                    aria-label={cell.dateStr}
                    data-date={cell.dateStr}
                    data-selected={selected ? '' : undefined}
                    data-in-range={inRange ? '' : undefined}
                    disabled={disabled}
                    onClick={() => selectDate(cell.dateStr)}
                    width="7r"
                    height="7r"
                    display="inline-flex"
                    alignItems="center"
                    justifyContent="center"
                    borderRadius="full"
                    border="none"
                    bg={selected ? 'ui.button.background' : 'transparent'}
                    color={selected ? 'ui.button.foreground' : 'design.text.base'}
                    fontSize="3r"
                    fontWeight={selected ? '600' : '400'}
                    cursor={disabled ? 'not-allowed' : 'pointer'}
                    outline="none"
                    _hover={!selected && !disabled ? { bg: 'ui.button.mutedBackground' } : undefined}
                    _focusVisible={{ outline: '2px solid', outlineColor: 'ui.focus.ring', outlineOffset: '2px' }}
                  >
                    {cell.dayNum}
                  </Button>
                </Td>
              )
            })}
          </Tr>
        ))}
      </Tbody>
    </Table>
  )
}

export function Calendar({
  children,
  mode = 'day',
  value: valueProp,
  defaultValue = null,
  onChange,
  locale = 'en-US',
  month: monthProp,
  onMonthChange,
  min,
  max,
  disabled = false,
  className,
  style,
  ...props
}: CalendarProps) {
  const isControlledValue = valueProp !== undefined
  const [internalValue, setInternalValue] = React.useState<ISODate | DateRangeValue | null>(defaultValue)
  const value = isControlledValue ? valueProp : internalValue
  const [viewMode, setViewMode] = React.useState<'day' | 'month'>('day')

  const parseMonth = (mStr?: string) => {
    if (!mStr) {
      if (typeof value === 'string' && value.includes('-')) {
        const [y, m] = value.split('-').map(Number)
        if (y && m) return { year: y, month: m - 1 }
      }
      if (value && typeof value === 'object' && 'start' in value && value.start) {
        const [y, m] = value.start.split('-').map(Number)
        if (y && m) return { year: y, month: m - 1 }
      }
      const now = new Date()
      return { year: now.getUTCFullYear(), month: now.getUTCMonth() }
    }
    const [y, m] = mStr.split('-').map(Number)
    return { year: y || 2026, month: (m || 1) - 1 }
  }

  const [internalMonth, setInternalMonth] = React.useState(() => parseMonth(monthProp))
  const currentMonth = monthProp ? parseMonth(monthProp) : internalMonth

  const toggleViewMode = React.useCallback(() => {
    setViewMode(v => (v === 'day' ? 'month' : 'day'))
  }, [])

  const selectMonth = React.useCallback(
    (monthIndex: number) => {
      const nextY = currentMonth.year
      const monthStr = `${nextY}-${String(monthIndex + 1).padStart(2, '0')}`
      if (!monthProp) {
        setInternalMonth({ year: nextY, month: monthIndex })
      }
      onMonthChange?.(monthStr)
      setViewMode('day')
    },
    [currentMonth.year, monthProp, onMonthChange]
  )

  const goToPrevMonth = React.useCallback(() => {
    let nextY = currentMonth.year
    let nextM = currentMonth.month - 1
    if (nextM < 0) {
      nextM = 11
      nextY -= 1
    }
    const monthStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}`
    if (!monthProp) {
      setInternalMonth({ year: nextY, month: nextM })
    }
    onMonthChange?.(monthStr)
  }, [currentMonth, monthProp, onMonthChange])

  const goToNextMonth = React.useCallback(() => {
    let nextY = currentMonth.year
    let nextM = currentMonth.month + 1
    if (nextM > 11) {
      nextM = 0
      nextY += 1
    }
    const monthStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}`
    if (!monthProp) {
      setInternalMonth({ year: nextY, month: nextM })
    }
    onMonthChange?.(monthStr)
  }, [currentMonth, monthProp, onMonthChange])

  const isDateSelected = React.useCallback(
    (dateStr: ISODate) => {
      if (mode === 'day') {
        return value === dateStr
      }
      if (mode === 'range' && value && typeof value === 'object') {
        const range = value as DateRangeValue
        return range.start === dateStr || range.end === dateStr
      }
      return false
    },
    [mode, value]
  )

  const isDateInRange = React.useCallback(
    (dateStr: ISODate) => {
      if (mode === 'range' && value && typeof value === 'object') {
        const range = value as DateRangeValue
        if (range.start && range.end) {
          return dateStr > range.start && dateStr < range.end
        }
      }
      return false
    },
    [mode, value]
  )

  const isRangeStart = React.useCallback(
    (dateStr: ISODate) => {
      if (mode === 'range' && value && typeof value === 'object') {
        const range = value as DateRangeValue
        return range.start === dateStr
      }
      return false
    },
    [mode, value]
  )

  const isRangeEnd = React.useCallback(
    (dateStr: ISODate) => {
      if (mode === 'range' && value && typeof value === 'object') {
        const range = value as DateRangeValue
        return range.end === dateStr
      }
      return false
    },
    [mode, value]
  )

  const selectDate = React.useCallback(
    (dateStr: ISODate) => {
      if (mode === 'day') {
        if (!isControlledValue) {
          setInternalValue(dateStr)
        }
        onChange?.(dateStr)
      } else if (mode === 'range') {
        let nextRange: DateRangeValue
        const curr = value as DateRangeValue | null
        if (!curr || (curr.start && curr.end) || !curr.start) {
          nextRange = { start: dateStr, end: null }
        } else {
          if (dateStr < curr.start) {
            nextRange = { start: dateStr, end: curr.start }
          } else {
            nextRange = { start: curr.start, end: dateStr }
          }
        }
        if (!isControlledValue) {
          setInternalValue(nextRange)
        }
        onChange?.(nextRange)
      }
    },
    [mode, isControlledValue, value, onChange]
  )

  const contextValue = React.useMemo<CalendarContextValue>(
    () => ({
      mode,
      value,
      currentMonth,
      locale,
      disabled,
      viewMode,
      toggleViewMode,
      selectMonth,
      goToPrevMonth,
      goToNextMonth,
      selectDate,
      isDateSelected,
      isDateInRange,
      isRangeStart,
      isRangeEnd,
    }),
    [
      mode,
      value,
      currentMonth,
      locale,
      disabled,
      viewMode,
      toggleViewMode,
      selectMonth,
      goToPrevMonth,
      goToNextMonth,
      selectDate,
      isDateSelected,
      isDateInRange,
      isRangeStart,
      isRangeEnd,
    ]
  )

  return (
    <CalendarContext.Provider value={contextValue}>
      <Div
        data-reference-calendar=""
        data-disabled={disabled ? '' : undefined}
        width="65r"
        p="3r"
        border="1px solid"
        borderColor="ui.field.border"
        borderRadius="md"
        bg="ui.field.background"
        userSelect="none"
        className={className}
        style={style}
        {...props}
      >
        {children ?? (
          <>
            <CalendarHeader>
              <CalendarPrevButton />
              <CalendarHeading />
              <CalendarNextButton />
            </CalendarHeader>
            <CalendarGrid />
          </>
        )}
      </Div>
    </CalendarContext.Provider>
  )
}

Calendar.Header = CalendarHeader
Calendar.Heading = CalendarHeading
Calendar.PrevButton = CalendarPrevButton
Calendar.NextButton = CalendarNextButton
Calendar.Grid = CalendarGrid
