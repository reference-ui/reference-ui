/**
 * Weekdays part: the locale-ordered weekday header section — exactly
 * `thead > tr > th[scope="col"]`. Props and refs target the `thead`;
 * per-day customization belongs to `Calendar.Days`.
 */
import * as React from 'react'
import { Thead, Tr, Th } from '@reference-ui/react'
import { CalendarContext } from '../context'
import type { CalendarWeekdaysProps } from '../types'

export function CalendarWeekdays({
  className,
  style,
  ref: consumerRef,
  ...props
}: CalendarWeekdaysProps) {
  const context = React.useContext(CalendarContext)
  // Hooks before the early return: the callback identity must stay
  // stable across context-present transitions.
  const setSectionRef = React.useCallback(
    (node: HTMLTableSectionElement | null) => {
      if (typeof consumerRef === 'function') {
        consumerRef(node)
      } else if (consumerRef && typeof consumerRef === 'object') {
        ;(consumerRef as React.RefObject<HTMLTableSectionElement | null>).current = node
      }
    },
    [consumerRef]
  )
  if (!context) return null
  const { headers } = context

  return (
    <Thead className={className} style={style} ref={setSectionRef} {...props}>
      <Tr role="row">
        {headers.map((header) => (
          <Th
            key={header.weekday}
            role="columnheader"
            scope="col"
            aria-label={header.accessibleName}
            fontSize="3r"
            color="design.text.light"
            p="1r 0"
            fontWeight="500"
          >
            {header.visibleText}
          </Th>
        ))}
      </Tr>
    </Thead>
  )
}
