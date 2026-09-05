import * as React from 'react'
import { Button, Div, Span, type PrimitiveProps, type PrimitiveElement } from '@reference-ui/react'
import { Overlay, type OverlayContentProps } from '../Overlay'
import { RovingFocus } from '../RovingFocus'
import { controlSize, controlHeightPx } from '../../core/theme/primitives/shared'

export interface MenuProps {
  children?: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

interface MenuContextValue {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const MenuContext = React.createContext<MenuContextValue | null>(null)

export function Menu({
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
}: MenuProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const isControlled = openProp !== undefined
  const isOpen = isControlled ? openProp : internalOpen

  const setIsOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen)
      }
      onOpenChange?.(nextOpen)
    },
    [isControlled, onOpenChange]
  )

  const contextValue = React.useMemo<MenuContextValue>(
    () => ({
      isOpen,
      setIsOpen,
    }),
    [isOpen, setIsOpen]
  )

  return (
    <MenuContext.Provider value={contextValue}>
      <Overlay open={isOpen} onOpenChange={setIsOpen} isolation={false}>
        {children}
      </Overlay>
    </MenuContext.Provider>
  )
}

export function MenuTrigger({
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof Overlay.Trigger>) {
  return (
    <Overlay.Trigger aria-haspopup="menu" {...props}>
      {children}
    </Overlay.Trigger>
  )
}

export type MenuContentProps = OverlayContentProps

export function MenuContent({
  children,
  className,
  style,
  ...props
}: MenuContentProps) {
  return (
    <Overlay.Content
      role="menu"
      data-reference-menu-content=""
      placement="bottom-start"
      minW="40r"
      bg="ui.dialog.background"
      color="ui.dialog.foreground"
      borderRadius="md"
      p="1r"
      boxShadow="0 4px 16px rgba(0,0,0,0.12)"
      border="1px solid"
      borderColor="ui.dialog.border"
      zIndex={50}
      className={className}
      style={style}
      {...props}
    >
      <RovingFocus.Root orientation="vertical" loop>
        <Div display="flex" flexDirection="column" gap="0.5r" outline="none">
          {children}
        </Div>
      </RovingFocus.Root>
    </Overlay.Content>
  )
}

export type MenuItemProps = PrimitiveProps<'div'> & {
  disabled?: boolean
  selected?: boolean
  onSelect?: () => void
  closeOnSelect?: boolean
}

export function MenuItem({
  children,
  disabled = false,
  selected = false,
  onSelect,
  closeOnSelect = true,
  onClick,
  onKeyDown,
  className,
  style,
  ...props
}: MenuItemProps) {
  const context = React.useContext(MenuContext)

  const handleSelect = () => {
    if (disabled) return
    onSelect?.()
    if (closeOnSelect && context) {
      context.setIsOpen(false)
    }
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    onClick?.(e)
    if (!e.defaultPrevented) {
      handleSelect()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (!e.defaultPrevented && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      handleSelect()
    }
  }

  return (
    <RovingFocus.Item disabled={disabled}>
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
        height={controlSize.height}
        minHeight={controlSize.height}
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
          height: controlHeightPx,
          boxSizing: 'border-box',
          ...style,
        }}
        {...props}
      >
        {children}
      </Div>
    </RovingFocus.Item>
  )
}

export type MenuCheckboxItemProps = MenuItemProps & {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  indicator?: React.ReactNode
}

export function MenuCheckboxItem({
  checked = false,
  onCheckedChange,
  children,
  onSelect,
  closeOnSelect = false,
  indicator,
  ...props
}: MenuCheckboxItemProps) {
  const handleSelect = () => {
    onCheckedChange?.(!checked)
    onSelect?.()
  }

  return (
    <MenuItem
      role="menuitemcheckbox"
      aria-checked={checked}
      data-state={checked ? 'checked' : 'unchecked'}
      closeOnSelect={closeOnSelect}
      onSelect={handleSelect}
      {...props}
    >
      <Span
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        width="4r"
        height="4r"
        mr="2r"
        color="inherit"
      >
        {checked ? (indicator ?? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )) : null}
      </Span>
      {children}
    </MenuItem>
  )
}

export type MenuSeparatorProps = PrimitiveProps<'div'>

export function MenuSeparator({
  className,
  style,
  ...props
}: MenuSeparatorProps) {
  return (
    <Div
      role="separator"
      height="1px"
      bg="ui.hr.border"
      my="1r"
      className={className}
      style={style}
      {...props}
    />
  )
}

Menu.Trigger = MenuTrigger
Menu.Content = MenuContent
Menu.Item = MenuItem
Menu.CheckboxItem = MenuCheckboxItem
Menu.Separator = MenuSeparator
