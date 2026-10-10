/**
 * Range picker layer: unfolds the registered picker slot into the
 * managed Overlay.Content dialog. Absent without a picker part; the
 * default content is the range Calendar bound to the draft (managed
 * mode, draft value, bound pane), caller children replacing it.
 */
import * as React from 'react'
import { Overlay } from '../../Overlay'
import { Calendar } from '../../Calendar'
import { DateFieldRangeContext } from '../context'
import { useSlot } from '../slots/slots'

export function DateFieldRangePickerLayer() {
  const context = React.useContext(DateFieldRangeContext)
  const pickerSlot = useSlot('picker')
  if (!context || !pickerSlot) return null

  const {
    calendarValue,
    locale,
    min,
    max,
    isDateUnavailable,
    paneMonth,
    setPaneMonth,
    pickerId,
    handleRangeSelect,
  } = context

  const pickerProps = (pickerSlot.element.props as Record<string, any> | undefined) ?? {}
  const pickerRef = pickerSlot.meta?.ref as React.Ref<HTMLDivElement> | undefined
  const placement = pickerProps.placement ?? 'bottom-start'

  const {
    id: _pickerId,
    role: _pickerRole,
    placement: _pickerPlacement,
    children: _pickerChildren,
    ...restPickerProps
  } = pickerProps

  return (
    <Overlay.Content
      role="dialog"
      placement={placement}
      bg="ui.dialog.background"
      color="ui.dialog.foreground"
      borderRadius="md"
      boxShadow="0 4px 16px rgba(0,0,0,0.15)"
      border="1px solid"
      borderColor="ui.dialog.border"
      p="2r"
      {...(restPickerProps as any)}
      id={pickerId}
      data-reference-date-picker=""
      ref={(node: HTMLDivElement | null) => {
        if (typeof pickerRef === 'function') {
          pickerRef(node)
        } else if (pickerRef && typeof pickerRef === 'object') {
          ;(pickerRef as React.RefObject<HTMLDivElement | null>).current = node
        }
      }}
    >
      {pickerProps.children ?? (
        <Calendar
          mode="range"
          value={calendarValue}
          onChange={handleRangeSelect}
          locale={locale}
          min={min}
          max={max}
          isDateUnavailable={isDateUnavailable}
          month={paneMonth}
          onMonthChange={setPaneMonth}
        />
      )}
    </Overlay.Content>
  )
}
