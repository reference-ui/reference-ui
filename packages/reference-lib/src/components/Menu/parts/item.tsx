/**
 * Menu.Item: one command row. Takes children, disabled, selected,
 * textValue, cancelable onSelect, and closeOnClick; Enter and Space
 * funnel through the click path so handlers observe a single
 * activation. Selection dismisses the whole tree and restores the
 * root trigger unless canceled or opted out.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import { useOverlay } from '../../Overlay'
import { RovingFocus } from '../../RovingFocus'
import { controlSize, controlHeightPx } from '../../../core/theme/primitives/shared'
import { useMenuLevel } from '../context'
import { restoreFocusToTrigger } from '../focus/restore'
import { rootTriggerOf } from '../levels/registry'
import type { MenuItemProps } from '../types'

export const MenuItem = React.forwardRef<HTMLDivElement, MenuItemProps>(function MenuItem(
  {
    children,
    disabled = false,
    selected = false,
    textValue,
    onSelect,
    closeOnClick = true,
    closeOnSelect,
    onClick,
    onKeyDown,
    className,
    style,
    ...props
  }: MenuItemProps,
  ref
) {
  const overlay = useOverlay()
  const level = useMenuLevel()
  const shouldClose = closeOnSelect !== undefined ? closeOnSelect : closeOnClick

  const dismissAfterSelect = React.useCallback(() => {
    if (level) {
      level.requestTreeDismiss()
      restoreFocusToTrigger(rootTriggerOf(level))
      return
    }
    if (overlay) {
      overlay.setIsOpen(false)
      restoreFocusToTrigger(overlay.triggerRef.current as HTMLElement | null)
    }
  }, [level, overlay])

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) {
      e.preventDefault()
      return
    }
    onClick?.(e)
    if (e.defaultPrevented) return
    onSelect?.(e.nativeEvent)
    if (e.nativeEvent.defaultPrevented) return
    if (shouldClose) dismissAfterSelect()
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
      if (shouldClose) dismissAfterSelect()
    }
  }

  return (
    <RovingFocus.Item disabled={disabled} textValue={textValue}>
      <Div
        role="menuitem"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled ? 'true' : undefined}
        data-disabled={disabled ? '' : undefined}
        data-state={selected ? 'selected' : undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        display="flex"
        alignItems="center"
        minHeight={controlSize.height}
        height="auto"
        px="3r"
        py={controlSize.paddingBlock}
        boxSizing="border-box"
        borderRadius="sm"
        fontSize="3.5r"
        lineHeight="5r"
        cursor={disabled ? 'not-allowed' : 'pointer'}
        bg={selected ? 'ui.table.row.mutedBackground' : 'transparent'}
        color="design.text.base"
        opacity={disabled ? 0.5 : 1}
        outline="none"
        userSelect="none"
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
        {children}
      </Div>
    </RovingFocus.Item>
  )
})
