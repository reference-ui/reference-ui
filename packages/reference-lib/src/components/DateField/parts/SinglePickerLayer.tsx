/**
 * Single-field picker layer: unfolds the registered picker slot into
 * the managed Overlay.Content dialog. Absent without a picker part;
 * the default content is the bound single Calendar, caller children
 * replacing it.
 */
import * as React from 'react'
import { Overlay } from '../../Overlay'
import { Calendar } from '../../Calendar'
import { DateFieldContext } from '../context'
import { useSlot } from '../slots/slots'

export function DateFieldPickerLayer() {
  const context = React.useContext(DateFieldContext)
  const pickerSlot = useSlot('picker')
  if (!context || !pickerSlot) return null

  const { value, locale, min, max, pickerId, handleDateSelect } = context

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
          value={value}
          locale={locale}
          min={min}
          max={max}
          onChange={(nextVal) => handleDateSelect(nextVal)}
        />
      )}
    </Overlay.Content>
  )
}
