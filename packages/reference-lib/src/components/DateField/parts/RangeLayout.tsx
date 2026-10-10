/**
 * Range layout: the two endpoint inputs plus the shared trigger. An
 * explicit trigger part unfolds here, else the toggle synthesizes when
 * a picker is present; clicking returns focus to the active endpoint.
 */
import * as React from 'react'
import { CalendarTodayIcon } from '@reference-ui/icons'
import { Overlay } from '../../Overlay'
import { DateFieldRangeContext } from '../context'
import { useSlot } from '../slots/slots'
import { RangeEndpointInput } from './EndpointInput'

export function DateFieldRangeLayout() {
  const context = React.useContext(DateFieldRangeContext)
  const triggerSlot = useSlot('trigger')
  const pickerSlot = useSlot('picker')
  if (!context) return null

  const isPickerPresent = Boolean(pickerSlot)
  const { disabled, activeEndpoint, endpointRefs } = context

  let triggerNode: React.ReactNode = null
  if (triggerSlot || isPickerPresent) {
    const trigProps = (triggerSlot?.element.props as Record<string, any> | undefined) ?? {}
    const trigRef = triggerSlot?.meta?.ref as React.Ref<HTMLButtonElement> | undefined
    const isTriggerDisabled = trigProps.disabled ?? disabled

    const onTriggerClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      trigProps.onClick?.(e)
      if (!e.defaultPrevented && !isTriggerDisabled) {
        endpointRefs[activeEndpoint].current?.focus()
      }
    }

    const {
      onClick: _trigOnClick,
      disabled: _trigDisabled,
      tabIndex: _trigTabIndex,
      children: _trigChildren,
      ...restTrigProps
    } = trigProps

    triggerNode = (
      <Overlay.Trigger
        aria-haspopup="dialog"
        type="button"
        tabIndex={trigProps.tabIndex ?? -1}
        bg="transparent"
        border="none"
        p="0"
        width="6r"
        height="6r"
        minWidth="6r"
        marginInlineEnd="-2r"
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        cursor="pointer"
        color="design.text.base"
        _hover={{ bg: 'gray.800', color: 'ui.field.foreground' }}
        borderRadius="sm"
        {...(restTrigProps as any)}
        ref={(node: HTMLButtonElement | null) => {
          if (typeof trigRef === 'function') {
            trigRef(node)
          } else if (trigRef && typeof trigRef === 'object') {
            ;(trigRef as React.RefObject<HTMLButtonElement | null>).current = node
          }
        }}
        disabled={isTriggerDisabled}
        data-reference-date-trigger=""
        onClick={onTriggerClick}
      >
        {trigProps.children ?? <CalendarTodayIcon />}
      </Overlay.Trigger>
    )
  }

  return (
    <>
      <RangeEndpointInput endpoint="start" />
      <RangeEndpointInput endpoint="end" />
      {triggerNode}
    </>
  )
}
