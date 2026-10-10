/**
 * Year drill-down part: toggles the private year collection, pressed
 * while it is shown. In year mode the home collection is year, so
 * there is nothing to toggle back to.
 */
import * as React from 'react'
import { Button } from '@reference-ui/react'
import { CalendarContext } from '../context'
import type { CalendarYearProps } from '../types'

export function CalendarYear({
  children,
  className,
  style,
  onClick,
  ...props
}: CalendarYearProps) {
  const context = React.useContext(CalendarContext)
  if (!context) return null
  const { currentMonth, view, setView, mode } = context
  const isPressed = view === 'year'
  const yearText = String(currentMonth.year)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (!e.defaultPrevented) {
      setView(isPressed ? (mode === 'year' ? 'year' : 'day') : 'year')
    }
  }

  return (
    <Button
      type="button"
      data-reference-calendar-year=""
      aria-pressed={isPressed}
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
      {children ?? yearText}
    </Button>
  )
}
