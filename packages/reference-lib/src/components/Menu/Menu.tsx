import * as React from 'react'
import { Button, Div, Span, type PrimitiveProps, type PrimitiveElement } from '@reference-ui/react'
import { Overlay, type OverlayContentProps } from '../Overlay'
import { RovingFocus } from '../RovingFocus'

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
          <Div display="flex" flexDirection="column" gap="0.5r">
            {children}
          </Div>
        </RovingFocus.Root>
      </Overlay.Content>
  )
}

export type MenuItemProps = PrimitiveProps<'div'> & {
  disabled?: boolean
  onSelect?: () => void
  closeOnSelect?: boolean
}

export function MenuItem({
  children,
  disabled = false,
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
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        display="flex"
        alignItems="center"
        px="2.5r"
        py="1.5r"
        borderRadius="sm"
        fontSize="3.5r"
        cursor={disabled ? 'not-allowed' : 'pointer'}
        opacity={disabled ? 0.5 : 1}
        outline="none"
        userSelect="none"
        _hover={!disabled ? { bg: 'colors.gray.100', color: 'design.text.base' } : undefined}
        _focusVisible={{ outline: '2px solid', outlineColor: 'ui.focus.ring', outlineOffset: '2px' }}
        className={className}
        style={style}
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
}

export function MenuCheckboxItem({
  checked = false,
  onCheckedChange,
  children,
  onSelect,
  closeOnSelect = false,
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
      <Span display="inline-flex" width="4r" mr="1.5r">{checked ? '✓' : ''}</Span>
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
