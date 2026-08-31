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
  goToPrevMonth: () => void
  goToNextMonth: () => void
  selectDate: (dateStr: ISODate) => void
  isDateSelected: (dateStr: ISODate) => boolean
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

export type CalendarHeadingProps = PrimitiveProps<'h2'>

export function CalendarHeading({
  className,
  style,
  ...props
}: CalendarHeadingProps) {
  const context = React.useContext(CalendarContext)
  if (!context) return null

  const { currentMonth, locale } = context
  const date = new Date(Date.UTC(currentMonth.year, currentMonth.month, 1))
  const monthName = date.toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

  return (
    <H2
      data-reference-calendar-heading=""
      fontSize="4r"
      fontWeight="600"
      m="0"
      color="design.text.base"
      className={className}
      style={style}
      {...props}
    >
      {monthName}
    </H2>
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
      p="1r 2r"
      borderRadius="sm"
      border="1px solid"
      borderColor="ui.field.border"
      bg="ui.button.background"
      color="ui.button.foreground"
      cursor="pointer"
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
      p="1r 2r"
      borderRadius="sm"
      border="1px solid"
      borderColor="ui.field.border"
      bg="ui.button.background"
      color="ui.button.foreground"
      cursor="pointer"
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

  const { currentMonth, selectDate, isDateSelected, disabled } = context
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
              p="1r"
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
                return <Td key={cIdx} role="gridcell" p="0.5r" />
              }

              const selected = isDateSelected(cell.dateStr)

              return (
                <Td key={cIdx} role="gridcell" p="0.5r">
                  <Button
                    type="button"
                    role="gridcell"
                    tabIndex={selected ? 0 : -1}
                    aria-selected={selected}
                    aria-label={cell.dateStr}
                    data-date={cell.dateStr}
                    data-selected={selected ? '' : undefined}
                    disabled={disabled}
                    onClick={() => selectDate(cell.dateStr)}
                    width="7r"
                    height="7r"
                    display="inline-flex"
                    alignItems="center"
                    justifyContent="center"
                    borderRadius="full"
                    border="none"
                    bg={selected ? 'colors.gray.900' : 'transparent'}
                    color={selected ? 'colors.gray.50' : 'design.text.base'}
                    fontSize="3r"
                    fontWeight={selected ? '600' : '400'}
                    cursor={disabled ? 'not-allowed' : 'pointer'}
                    outline="none"
                    _hover={!selected && !disabled ? { bg: 'colors.gray.100' } : undefined}
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

  const parseMonth = (mStr?: string) => {
    if (!mStr) {
      const now = new Date()
      return { year: now.getUTCFullYear(), month: now.getUTCMonth() }
    }
    const [y, m] = mStr.split('-').map(Number)
    return { year: y || 2026, month: (m || 1) - 1 }
  }

  const [internalMonth, setInternalMonth] = React.useState(() => parseMonth(monthProp))
  const currentMonth = monthProp ? parseMonth(monthProp) : internalMonth

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
      goToPrevMonth,
      goToNextMonth,
      selectDate,
      isDateSelected,
    }),
    [mode, value, currentMonth, locale, disabled, goToPrevMonth, goToNextMonth, selectDate, isDateSelected]
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
