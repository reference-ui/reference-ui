/**
 * Day part: the public day button. Managed props — id, roving tabIndex,
 * native/ARIA disabled, full-date label, selection/range/today semantics —
 * stay authoritative over conflicting consumer props; consumer children,
 * styles, decoration, and refs compose. Consumer events run first;
 * `preventDefault()` cancels the derived default. `forwardRef` (not
 * ref-as-prop like the section parts) so the native ref works on
 * React 17 too.
 */
import * as React from 'react'
import { Button } from '@reference-ui/react'
import { GridSectionContext } from '../context'
import type { CalendarDayProps } from '../types'

export const CalendarDay = React.forwardRef<HTMLButtonElement, CalendarDayProps>(
  function CalendarDay(dayProps, forwardedRef) {
    const {
      date,
      children,
      onClick: consumerOnClick,
      onKeyDown: consumerOnKeyDown,
      onFocus: consumerOnFocus,
      onBlur: consumerOnBlur,
      onMouseEnter: consumerOnMouseEnter,
      onMouseLeave: consumerOnMouseLeave,
      onMouseOver: consumerOnMouseOver,
      onMouseOut: consumerOnMouseOut,
      // Managed props below are stripped: decoration can never forge
      // accessibility, selection, or focus authority (CA-DAY-06).
      // Consumer `type` is NOT stripped — an explicit type wins, matching
      // the nav parts' CA-GRID-10 rule.
      id: _managedId,
      tabIndex: _managedTabIndex,
      disabled: _managedDisabled,
      'aria-label': _managedLabel,
      'aria-selected': _managedSelected,
      'aria-disabled': _managedDisabledAria,
      'aria-current': _managedCurrent,
      'data-date': _managedDataDate,
      'data-selected': _managedDataSelected,
      'data-in-range': _managedDataInRange,
      'data-outside-month': _managedDataOutside,
      'data-today': _managedDataToday,
      'data-disabled': _managedDataDisabled,
      'data-unavailable': _managedDataUnavailable,
      'data-focused': _managedDataFocused,
      'data-range-start': _managedDataRangeStart,
      'data-range-end': _managedDataRangeEnd,
      ...rest
    } = dayProps
    const section = React.useContext(GridSectionContext)
    const model = section?.getModel(date) ?? null
    if (!model) return null

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      consumerOnClick?.(event)
      if (!event.defaultPrevented && section) {
        section.onDayClick(date)
      }
    }
    const handleFocus = (event: React.FocusEvent<HTMLButtonElement>) => {
      consumerOnFocus?.(event)
      section?.onDayFocus(date)
    }
    const handleBlur = (event: React.FocusEvent<HTMLButtonElement>) => {
      consumerOnBlur?.(event)
    }
    // Preview tracking rides mouseover/mouseout — not enter/leave —
    // because React's enter/leave polyfill cannot see through shadow
    // retargeting while the bubbling pair dispatches via composedPath
    // (CA-ENV-03). The containment guards restore exact enter/leave
    // semantics in the light DOM; under retargeting they pass through
    // and the idempotent set/clear keeps the end state correct.
    const handleMouseOver = (event: React.MouseEvent<HTMLButtonElement>) => {
      consumerOnMouseOver?.(event)
      const related = event.relatedTarget as Node | null
      if (related && event.currentTarget.contains(related)) return
      section?.onDayMouseEnter(date)
    }
    const handleMouseOut = (event: React.MouseEvent<HTMLButtonElement>) => {
      consumerOnMouseOut?.(event)
      const related = event.relatedTarget as Node | null
      if (related && event.currentTarget.contains(related)) return
      section?.onDayMouseLeave(date)
    }

    return (
      <Button
        type="button"
        id={model.id}
        tabIndex={model.tabIndex}
        disabled={model.disabled}
        aria-disabled={model.unselectable ? 'true' : undefined}
        aria-selected={model.selectedInclusive}
        aria-current={model.isToday ? 'date' : undefined}
        aria-label={model.cell.accessibleName}
        data-date={model.cell.date}
        data-selected={model.selected ? '' : undefined}
        data-in-range={model.inRangeInclusive ? '' : undefined}
        data-outside-month={model.cell.outsideMonth ? '' : undefined}
        data-today={model.isToday ? '' : undefined}
        data-disabled={model.disabled ? '' : undefined}
        data-unavailable={model.unavailable ? '' : undefined}
        data-focused={model.isFocused ? '' : undefined}
        data-range-start={model.rangeStart ? '' : undefined}
        data-range-end={model.rangeEnd ? '' : undefined}
        width="7r"
        height="7r"
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        borderRadius="full"
        border="none"
        bg={model.selected ? 'ui.button.background' : 'transparent'}
        color={
          model.selected
            ? 'ui.button.foreground'
            : model.unselectable || model.cell.outsideMonth
              ? 'design.text.light'
              : 'design.text.base'
        }
        fontSize="3r"
        fontWeight={model.selected || model.isToday ? '600' : '400'}
        textDecoration={model.isToday ? 'underline' : undefined}
        textUnderlineOffset={model.isToday ? '0.15em' : undefined}
        cursor={model.unselectable ? 'not-allowed' : 'pointer'}
        outline="none"
        _hover={
          !model.selected && !model.unselectable
            ? { bg: 'ui.button.mutedBackground' }
            : undefined
        }
        _focusVisible={{ outline: '2px solid', outlineColor: 'ui.focus.ring', outlineOffset: '2px' }}
        {...rest}
        onClick={handleClick}
        onKeyDown={consumerOnKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onMouseEnter={consumerOnMouseEnter}
        onMouseLeave={consumerOnMouseLeave}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
        ref={forwardedRef}
      >
        {children}
      </Button>
    )
  }
)
CalendarDay.displayName = 'Calendar.Day'
