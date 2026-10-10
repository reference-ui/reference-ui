/**
 * DateField.Range root: composition only. The required-prop guards run
 * first, the range draft resolves the buffers and handlers, and the
 * render hosts the compound parts through the shared slot provider —
 * both endpoints plus the trigger unfolding from the layout, the bound
 * range Calendar from the picker layer.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import { Overlay } from '../Overlay'
import { DateFieldRangeContext, type DateFieldRangeContextValue } from './context'
import { assertValidDateBounds } from './engine/parse'
import { useRangeDraft } from './hooks/use-range-draft'
import { DateFieldEnd } from './parts/End'
import { DateFieldRangeLayout } from './parts/RangeLayout'
import { DateFieldRangePickerLayer } from './parts/RangePickerLayer'
import { DateFieldStart } from './parts/Start'
import { DateFieldSlotProvider } from './slots/slots'
import type { DateFieldRangeProps } from './types'

export type {
  DateFieldEndProps,
  DateFieldRangeEndpoint,
  DateFieldRangeName,
  DateFieldRangeProps,
  DateFieldStartProps,
} from './types'
export { DateFieldRangeContext } from './context'
export { DateFieldEnd } from './parts/End'
export { DateFieldStart } from './parts/Start'

export const DateFieldRange = React.forwardRef<HTMLDivElement, DateFieldRangeProps>(
  function DateFieldRange(
    {
      children,
      value,
      onChange,
      locale,
      min,
      max,
      isDateUnavailable,
      disabled = false,
      readOnly = false,
      required = false,
      name,
      form,
      className,
      style,
      onKeyDown: rootOnKeyDown,
      onFocus: rootOnFocus,
      onBlur: rootOnBlur,
      onClick: rootOnClick,
      ...props
    },
    ref
  ) {
    if (locale == null) {
      throw new Error('[reference-ui] DateField.Range requires an explicit locale prop.')
    }
    assertValidDateBounds(min, max)
    if (value === undefined) {
      throw new Error(
        '[reference-ui] DateField.Range requires an explicit value prop (null is the empty value).'
      )
    }
    if (onChange == null) {
      throw new Error('[reference-ui] DateField.Range requires an explicit onChange prop.')
    }

    const [isOpen, setIsOpen] = React.useState(false)

    const {
      constraintInvalid,
      buffers,
      isDirty,
      failed,
      resetEpoch,
      activeEndpoint,
      paneMonth,
      setPaneMonth,
      endpointRefs,
      calendarValue,
      canApply,
      handleRangeSelect,
      handleEndpointInput,
      handleEndpointKeyDown,
      handleEndpointBlur,
      handleEndpointFocus,
      handleEndpointClick,
      handleCompositionStart,
      handleCompositionEnd,
    } = useRangeDraft({
      value,
      onChange,
      locale,
      min,
      max,
      isDateUnavailable,
      disabled,
      readOnly,
      setIsOpen,
    })

    const reactId = React.useId()
    const [pickerId] = React.useState(() => `datefield-range-picker-${reactId.replace(/:/g, '')}`)

    const fieldRef = React.useRef<HTMLDivElement | null>(null)

    const rootHandlers = React.useMemo(
      () => ({
        onKeyDown: rootOnKeyDown as
          | ((e: React.KeyboardEvent<HTMLInputElement>) => void)
          | ((e: React.KeyboardEvent<HTMLInputElement>) => void)
          | undefined,
        onFocus: rootOnFocus as
          | ((e: React.FocusEvent<HTMLInputElement>) => void)
          | undefined,
        onBlur: rootOnBlur as ((e: React.FocusEvent<HTMLInputElement>) => void) | undefined,
        onClick: rootOnClick as ((e: React.MouseEvent<HTMLInputElement>) => void) | undefined,
      }),
      [rootOnKeyDown, rootOnFocus, rootOnBlur, rootOnClick]
    )

    const contextValue = React.useMemo<DateFieldRangeContextValue>(
      () => ({
        rangeValue: value,
        calendarValue,
        locale,
        min,
        max,
        isDateUnavailable,
        isOpen,
        canApply,
        activeEndpoint,
        disabled,
        readOnly,
        required,
        pickerId,
        paneMonth,
        setPaneMonth,
        endpointRefs,
        buffers,
        isDirty,
        failed,
        constraintInvalid,
        handleRangeSelect,
        handleEndpointInput,
        handleEndpointKeyDown,
        handleEndpointBlur,
        handleEndpointFocus,
        handleEndpointClick,
        handleCompositionStart,
        handleCompositionEnd,
        rootHandlers,
      }),
      [
        value,
        calendarValue,
        locale,
        min,
        max,
        isDateUnavailable,
        isOpen,
        canApply,
        activeEndpoint,
        disabled,
        readOnly,
        required,
        pickerId,
        paneMonth,
        setPaneMonth,
        endpointRefs,
        buffers,
        isDirty,
        failed,
        constraintInvalid,
        handleRangeSelect,
        handleEndpointInput,
        handleEndpointKeyDown,
        handleEndpointBlur,
        handleEndpointFocus,
        handleEndpointClick,
        handleCompositionStart,
        handleCompositionEnd,
        rootHandlers,
      ]
    )

    const composedFieldRef = (node: HTMLDivElement | null) => {
      fieldRef.current = node
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref && typeof ref === 'object') {
        ;(ref as React.RefObject<HTMLDivElement | null>).current = node
      }
    }

    // A string name serializes both endpoints under one name
    // (`FormData.getAll` yields `[start, end]`); the object form splits them.
    const startFormName = typeof name === 'string' ? name : name?.start
    const endFormName = typeof name === 'string' ? name : name?.end

    return (
      <DateFieldSlotProvider>
        <DateFieldRangeContext.Provider value={contextValue}>
          <Overlay open={isOpen} onOpenChange={setIsOpen} anchor={fieldRef} isolation={false}>
            <Div
              ref={composedFieldRef}
              data-reference-field=""
              data-can-apply={canApply ? 'true' : 'false'}
              data-active-endpoint={activeEndpoint}
              display="inline-flex"
              alignItems="center"
              width="100%"
              className={className}
              style={style}
              {...props}
            >
              {children}
              <DateFieldRangeLayout />
            </Div>
            <DateFieldRangePickerLayer />
            {startFormName && !disabled && (
              <input
                key={`hidden-start-${resetEpoch}`}
                type="hidden"
                name={startFormName}
                value={value?.start ?? ''}
                form={form}
              />
            )}
            {endFormName && !disabled && (
              <input
                key={`hidden-end-${resetEpoch}`}
                type="hidden"
                name={endFormName}
                value={value?.end ?? ''}
                form={form}
              />
            )}
          </Overlay>
        </DateFieldRangeContext.Provider>
      </DateFieldSlotProvider>
    )
  }
)
DateFieldRange.displayName = 'DateFieldRange'
