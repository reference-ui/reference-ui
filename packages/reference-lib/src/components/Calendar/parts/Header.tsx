/**
 * Header part: the nav row framing the calendar — Previous, Heading, and
 * Next by default. Pure layout; the buttons and heading read navigation
 * state from the context.
 */
import { Div } from '@reference-ui/react'
import type { CalendarHeaderProps } from '../types'

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
