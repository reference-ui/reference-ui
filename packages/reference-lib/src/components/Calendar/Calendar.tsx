import * as React from 'react'

export type CalendarMode = 'day' | 'range' | 'month' | 'year'
export type ISODate = string // YYYY-MM-DD
export interface DateRangeValue {
  start: ISODate | null
  end: ISODate | null
}

export interface CalendarProps
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'onChange' | 'value' | 'defaultValue'> {
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

export function CalendarHeader({
  children,
  className,
  style,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      data-reference-calendar-header=""
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

export function CalendarHeading({
  className,
  style,
  ...props
}: React.ComponentPropsWithoutRef<'h2'>) {
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
    <h2
      data-reference-calendar-heading=""
      className={className}
      style={{
        fontSize: 16,
        fontWeight: 600,
        margin: 0,
        ...style,
      }}
      {...props}
    >
      {monthName}
    </h2>
  )
}

export function CalendarPrevButton({
  children = '‹',
  className,
  style,
  onClick,
  ...props
}: React.ComponentPropsWithoutRef<'button'>) {
  const context = React.useContext(CalendarContext)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (!e.defaultPrevented) {
      context?.goToPrevMonth()
    }
  }

  return (
    <button
      type="button"
      aria-label="Previous month"
      disabled={context?.disabled}
      onClick={handleClick}
      className={className}
      style={{
        padding: '4px 8px',
        borderRadius: 4,
        border: '1px solid #ccc',
        backgroundColor: '#fff',
        cursor: 'pointer',
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  )
}

export function CalendarNextButton({
  children = '›',
  className,
  style,
  onClick,
  ...props
}: React.ComponentPropsWithoutRef<'button'>) {
  const context = React.useContext(CalendarContext)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (!e.defaultPrevented) {
      context?.goToNextMonth()
    }
  }

  return (
    <button
      type="button"
      aria-label="Next month"
      disabled={context?.disabled}
      onClick={handleClick}
      className={className}
      style={{
        padding: '4px 8px',
        borderRadius: 4,
        border: '1px solid #ccc',
        backgroundColor: '#fff',
        cursor: 'pointer',
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  )
}

export function CalendarGrid({
  className,
  style,
  ...props
}: React.ComponentPropsWithoutRef<'table'>) {
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
    <table
      role="grid"
      data-reference-calendar-grid=""
      className={className}
      style={{
        borderCollapse: 'collapse',
        width: '100%',
        textAlign: 'center',
        ...style,
      }}
      {...props}
    >
      <thead>
        <tr role="row">
          {weekDayNames.map((wd, i) => (
            <th
              key={i}
              role="columnheader"
              style={{
                fontSize: 12,
                color: '#666',
                padding: 4,
                fontWeight: 500,
              }}
            >
              {wd}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((week, wIdx) => (
          <tr key={wIdx} role="row">
            {week.map((cell, cIdx) => {
              if (!cell.inMonth) {
                return <td key={cIdx} role="gridcell" style={{ padding: 2 }} />
              }

              const selected = isDateSelected(cell.dateStr)

              return (
                <td key={cIdx} role="gridcell" style={{ padding: 2 }}>
                  <button
                    type="button"
                    role="button"
                    tabIndex={selected ? 0 : -1}
                    aria-selected={selected}
                    aria-label={cell.dateStr}
                    data-date={cell.dateStr}
                    data-selected={selected ? '' : undefined}
                    disabled={disabled}
                    onClick={() => selectDate(cell.dateStr)}
                    style={{
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: selected ? '#0066cc' : 'transparent',
                      color: selected ? '#fff' : 'inherit',
                      fontSize: 13,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      outline: 'none',
                    }}
                  >
                    {cell.dayNum}
                  </button>
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
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
      <div
        data-reference-calendar=""
        data-disabled={disabled ? '' : undefined}
        className={className}
        style={{
          width: 250,
          padding: 12,
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          backgroundColor: '#fff',
          userSelect: 'none',
          ...style,
        }}
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
      </div>
    </CalendarContext.Provider>
  )
}

Calendar.Header = CalendarHeader
Calendar.Heading = CalendarHeading
Calendar.PrevButton = CalendarPrevButton
Calendar.NextButton = CalendarNextButton
Calendar.Grid = CalendarGrid
