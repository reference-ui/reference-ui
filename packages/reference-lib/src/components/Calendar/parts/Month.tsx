/**
 * Month drill-down part: toggles the private month collection, pressed
 * while it is shown. In month mode the home collection is month, so
 * there is nothing to toggle back to.
 */
import * as React from 'react'
import { Button } from '@reference-ui/react'
import { CalendarContext } from '../context'
import { formatLongMonth } from '../shared/format'
import type { CalendarMonthProps } from '../types'

export function CalendarMonth({
  children,
  className,
  style,
  onClick,
  ...props
}: CalendarMonthProps) {
  const context = React.useContext(CalendarContext)
  if (!context) return null
  const { currentMonth, locale, view, setView, mode } = context
  const isPressed = view === 'month'
  const monthName = formatLongMonth(locale, currentMonth.year, currentMonth.month)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (!e.defaultPrevented) {
      // Toggle the private month view; in month mode the home collection
      // is month, so there is nothing to toggle back to (CA-VIEW-02).
      setView(isPressed ? (mode === 'month' ? 'month' : 'day') : 'month')
    }
  }

  return (
    <Button
      type="button"
      data-reference-calendar-month=""
      aria-pressed={isPressed}
      aria-label={monthName}
      onClick={handleClick}
      bg="transparent"
      border="none"
      p="1r"
      borderRadius="sm"
      fontSize="4r"
      fontWeight="600"
      color="design.text.base"
      cursor="pointer"
      className={className}
      style={style}
      {...props}
    >
      {children ?? monthName}
    </Button>
  )
}
