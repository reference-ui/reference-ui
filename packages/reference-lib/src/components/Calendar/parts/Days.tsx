/**
 * Days part: the date-cell section — exactly
 * `tbody > tr > td[role="gridcell"] > Calendar.Day`. Props and refs
 * target the `tbody`. Each renderer return is validated per date: a
 * direct `<Calendar.Day>` whose `date` exactly matches passes through
 * untouched, and anything else diagnoses once per date and renders that
 * cell non-interactive.
 */
import * as React from 'react'
import { Tbody, Tr, Td } from '@reference-ui/react'
import { GridSectionContext, type DayCellModel } from '../context'
import { isValidISODate } from '../dates/iso'
import { calendarDevDiagnostic } from '../shared/diagnostic'
import { describeRendererNode, isPartElement } from '../shared/elements'
import type { CalendarDaysProps, CalendarDaysRenderer } from '../types'
import { CalendarDay } from './Day'

function validateDayNode(
  node: React.ReactNode,
  model: DayCellModel,
  diagnose: (kind: string, message: string) => void
): React.ReactNode {
  const date = model.cell.date
  if (node === null || node === undefined || node === false) {
    diagnose(
      `${date}:missing`,
      `Days renderer for date ${JSON.stringify(date)} returned no element. ` +
        `Return exactly one <Calendar.Day date=${JSON.stringify(date)}> per date; ` +
        `the cell renders non-interactive.`
    )
    return null
  }
  const children = Array.isArray(node)
    ? node
    : React.isValidElement(node) && node.type === React.Fragment
      ? React.Children.toArray((node.props as { children?: React.ReactNode }).children)
      : null
  if (children !== null) {
    const dayCount = children.filter((child) => isPartElement(child, CalendarDay)).length
    if (dayCount > 1) {
      diagnose(
        `${date}:multiple:${dayCount}`,
        `Days renderer for date ${JSON.stringify(date)} returned ${dayCount} ` +
          `<Calendar.Day> elements. Return exactly one Day per date; the cell renders non-interactive.`
      )
    } else {
      diagnose(
        `${date}:foreign:${describeRendererNode(node)}`,
        `Days renderer for date ${JSON.stringify(date)} returned ${describeRendererNode(node)} ` +
          `instead of a direct <Calendar.Day date=${JSON.stringify(date)}>. ` +
          `A Day must be the direct return, never wrapped; the cell renders non-interactive.`
      )
    }
    return null
  }
  if (isPartElement(node, CalendarDay)) {
    const returnedDate = (node.props as { date?: unknown }).date
    if (returnedDate === date && typeof returnedDate === 'string' && isValidISODate(returnedDate)) {
      return node
    }
    diagnose(
      `${date}:mismatch:${String(returnedDate)}`,
      `Days renderer for date ${JSON.stringify(date)} returned ` +
        `<Calendar.Day date=${JSON.stringify(returnedDate)}>. ` +
        `Each Day date must exactly match its render-state date; the mismatched cell renders ` +
        `non-interactive and no callback receives the mismatched value.`
    )
    return null
  }
  diagnose(
    `${date}:foreign:${describeRendererNode(node)}`,
    `Days renderer for date ${JSON.stringify(date)} returned ${describeRendererNode(node)} ` +
      `instead of a direct <Calendar.Day date=${JSON.stringify(date)}>. ` +
      `Managed props are never cloned onto a substitute; the cell renders non-interactive.`
  )
  return null
}

export function CalendarDays({
  children,
  className,
  style,
  ref: consumerRef,
  ...props
}: CalendarDaysProps) {
  const section = React.useContext(GridSectionContext)
  const warnedRef = React.useRef<Set<string>>(new Set())
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
  if (!section) return null
  const { weeks, getModel } = section

  const renderer =
    typeof children === 'function' ? (children as CalendarDaysRenderer) : undefined
  if (children !== undefined && renderer === undefined) {
    calendarDevDiagnostic(
      `invalid Calendar.Days children: expected a render function ` +
        `(day) => <Calendar.Day date={day.date}> or omitted children for default days, ` +
        `received ${describeRendererNode(children)}. Rendering default days.`
    )
  }
  const diagnose = (kind: string, message: string) => {
    if (warnedRef.current.has(kind)) return
    warnedRef.current.add(kind)
    calendarDevDiagnostic(message)
  }

  return (
    <Tbody className={className} style={style} ref={setSectionRef} {...props}>
      {weeks.map((week, wIdx) => (
        <Tr key={wIdx} role="row">
          {week.map((cell) => {
            if (cell.year < 1 || cell.year > 9999) {
              return <Td key={cell.date} role="gridcell" p="0.5r 0" />
            }
            const model = getModel(cell.date)
            if (!model) return <Td key={cell.date} role="gridcell" p="0.5r 0" />
            return (
              <Td
                key={cell.date}
                role="gridcell"
                aria-selected={model.selectedInclusive}
                p="0.5r 0"
                textAlign="center"
                bg={model.paintInRange ? 'ui.table.row.mutedBackground' : undefined}
                borderTopLeftRadius={model.rangeStart ? 'full' : undefined}
                borderBottomLeftRadius={model.rangeStart ? 'full' : undefined}
                borderTopRightRadius={model.rangeEnd ? 'full' : undefined}
                borderBottomRightRadius={model.rangeEnd ? 'full' : undefined}
              >
                {renderer
                  ? validateDayNode(renderer(model.renderState), model, diagnose)
                  : (
                    <CalendarDay date={cell.date}>{model.defaultContent}</CalendarDay>
                  )}
              </Td>
            )
          })}
        </Tr>
      ))}
    </Tbody>
  )
}
