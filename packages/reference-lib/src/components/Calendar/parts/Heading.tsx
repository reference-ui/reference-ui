/**
 * Heading part: the locale-formatted collection name and the stable
 * polite atomic announcement source — one text mutation per accepted
 * month, no global announcer. Explicit children (the default Month/Year
 * drill-down buttons) replace the text; otherwise the text names the
 * shown collection.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import { CalendarContext } from '../context'
import { formatMonthYear, formatYear } from '../shared/format'
import type { CalendarHeadingProps } from '../types'

export function CalendarHeading({
  children,
  className,
  style,
  ...props
}: CalendarHeadingProps) {
  const context = React.useContext(CalendarContext)
  if (!context) return null

  // Locale-formatted div + the stable polite atomic announcement source
  // (FEATURES #11): one text mutation per accepted month, no global
  // announcer. Sync text — never effect-written — so mount produces no
  // redundant post-mount mutation (CA-GRID-12). Explicit children (the
  // default Month/Year drill-down buttons) replace the text; otherwise
  // the text names the shown collection — month + year in day view, the
  // year alone in month/year view (CA-VIEW-11).
  const { currentMonth, locale, headingId, view } = context
  const text =
    view === 'day'
      ? formatMonthYear(locale, currentMonth.year, currentMonth.month)
      : formatYear(locale, currentMonth.year)

  return (
    <Div
      data-reference-calendar-heading=""
      id={headingId}
      aria-live="polite"
      aria-atomic="true"
      p="1r 2r"
      fontSize="4r"
      fontWeight="600"
      m="0"
      color="design.text.base"
      display={children !== undefined ? 'inline-flex' : undefined}
      alignItems={children !== undefined ? 'center' : undefined}
      gap={children !== undefined ? '1r' : undefined}
      className={className}
      style={style}
      {...props}
    >
      {children ?? text}
    </Div>
  )
}
