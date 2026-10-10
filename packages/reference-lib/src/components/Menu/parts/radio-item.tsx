/**
 * Menu.RadioItem: one controlled radio command. Takes its value plus
 * the shared choice props; checked reads group equality, and every
 * activation requests through the group — including the
 * already-selected value, which the group never interprets. Valid
 * only inside a RadioGroup.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import { RovingFocus } from '../../RovingFocus'
import { controlHeightPx } from '../../../core/theme/primitives/shared'
import { MenuRadioGroupContext } from '../context'
import { devWarn } from '../shared/warn'
import { useChoiceDismiss } from '../hooks'
import type { MenuRadioItemProps } from '../types'
import { ChoiceIndicator, choiceItemLayout } from './indicator'

export const MenuRadioItem = React.forwardRef<HTMLDivElement, MenuRadioItemProps>(
  function MenuRadioItem(
    {
      children,
      value,
      disabled = false,
      textValue,
      onSelect,
      closeOnSelect = false,
      onClick,
      onKeyDown,
      className,
      style,
      ...props
    }: MenuRadioItemProps,
    ref
  ) {
    const group = React.useContext(MenuRadioGroupContext)
    const dismissAfterSelect = useChoiceDismiss()
    if (!group) {
      devWarn('Menu.RadioItem is valid only inside a Menu.RadioGroup.')
    }
    const checked = group != null && group.value === value

    const requestState = React.useCallback(() => {
      // Every activation requests, including the already-selected value;
      // the group never interprets parent acceptance (MN-CHOICE-04).
      group?.onChange?.(value)
    }, [group, value])

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

    return (
      <RovingFocus.Item disabled={disabled} textValue={textValue}>
        <Div
          role="menuitemradio"
          tabIndex={disabled ? -1 : 0}
          aria-checked={checked ? 'true' : 'false'}
          aria-disabled={disabled ? 'true' : undefined}
          data-disabled={disabled ? '' : undefined}
          data-state={checked ? 'checked' : 'unchecked'}
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
          <ChoiceIndicator glyph={checked ? '●' : ''} />
          {children}
        </Div>
      </RovingFocus.Item>
    )
  }
)
