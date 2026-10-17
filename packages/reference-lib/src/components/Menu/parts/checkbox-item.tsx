/**
 * Menu.CheckboxItem: a controlled choice command with checked, mixed,
 * and unchecked states. Takes the checked value plus onChange;
 * activation runs native handler, cancelable onSelect, one state
 * request, then optional dismissal. ARIA derives from props, never
 * from a hidden toggle.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import { RovingFocus } from '../../RovingFocus'
import { controlHeightPx } from '../../../core/theme/primitives/shared'
import { useChoiceDismiss } from '../hooks'
import type { MenuCheckboxItemProps } from '../types'
import { ChoiceIndicator, choiceItemLayout } from './indicator'

// --- Choice items ------------------------------------------------------
// Controlled choice commands. Activation order (MN-CHOICE-06): native
// handler → cancelable onSelect → one checked/value request → optional
// deepest-first dismissal. closeOnSelect defaults false; cancellation in a
// native handler or onSelect stops both the state request and dismissal
// (MN-CHOICE-07). Controlled props stay authoritative: ARIA derives from
// props, never from a hidden toggle (MN-CHOICE-03/05).

export const MenuCheckboxItem = React.forwardRef<HTMLDivElement, MenuCheckboxItemProps>(
  function MenuCheckboxItem(
    {
      children,
      checked,
      onChange,
      disabled = false,
      textValue,
      onSelect,
      closeOnSelect = false,
      onClick,
      onKeyDown,
      className,
      style,
      ...props
    }: MenuCheckboxItemProps,
    ref
  ) {
    const dismissAfterSelect = useChoiceDismiss()

    const requestState = React.useCallback(() => {
      // checked=true → false; false and mixed → true.
      const next = checked !== true
      onChange?.(next)
    }, [checked, onChange])

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) {
        e.preventDefault()
        return
      }
      onClick?.(e)
      if (e.defaultPrevented) return
      onSelect?.(e.nativeEvent)
      if (e.nativeEvent.defaultPrevented) return
      requestState()
      if (closeOnSelect) dismissAfterSelect()
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e)
      if (e.defaultPrevented || disabled) return
      if (e.key === 'Enter' || e.key === ' ') {
        e.stopPropagation()
        onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>)
        if (e.defaultPrevented) return
        onSelect?.(e.nativeEvent)
        if (e.nativeEvent.defaultPrevented) {
          e.preventDefault()
          return
        }
        e.preventDefault()
        requestState()
        if (closeOnSelect) dismissAfterSelect()
      }
    }

    const ariaChecked = checked === 'mixed' ? 'mixed' : checked ? 'true' : 'false'
    const dataState = checked === 'mixed' ? 'mixed' : checked ? 'checked' : 'unchecked'
    const glyph = checked === 'mixed' ? '–' : checked ? '✓' : ''

    return (
      <RovingFocus.Item disabled={disabled} textValue={textValue}>
        <Div
          role="menuitemcheckbox"
          tabIndex={disabled ? -1 : 0}
          aria-checked={ariaChecked}
          aria-disabled={disabled ? 'true' : undefined}
          data-disabled={disabled ? '' : undefined}
          data-state={dataState}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          {...choiceItemLayout(disabled)}
          _hover={!disabled ? { bg: 'ui.table.row.mutedBackground', color: 'design.text.base' } : undefined}
          _focus={{ bg: 'ui.table.row.mutedBackground', color: 'design.text.base', outline: 'none' }}
          _focusVisible={{ bg: 'ui.table.row.mutedBackground', color: 'design.text.base', outline: 'none' }}
          className={className}
          style={{
            minHeight: controlHeightPx,
            boxSizing: 'border-box',
            ...style,
          }}
          {...props}
          ref={ref}
        >
          <ChoiceIndicator glyph={glyph} />
          {children}
        </Div>
      </RovingFocus.Item>
    )
  }
)
