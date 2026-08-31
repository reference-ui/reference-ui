import * as React from 'react'
import { Overlay } from '../Overlay'
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
}: React.ComponentPropsWithoutRef<'button'>) {
  return (
    <Overlay.Trigger aria-haspopup="menu" {...props}>
      {children}
    </Overlay.Trigger>
  )
}

export function MenuContent({
  children,
  className,
  style,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <Overlay.Portal>
      <Overlay.Content
        role="menu"
        data-reference-menu-content=""
        className={className}
        style={{
          minWidth: 160,
          backgroundColor: '#fff',
          borderRadius: 6,
          padding: 4,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          border: '1px solid #e5e7eb',
          zIndex: 50,
          ...style,
        }}
        {...props}
      >
        <RovingFocus.Root orientation="vertical" loop>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {children}
          </div>
        </RovingFocus.Root>
      </Overlay.Content>
    </Overlay.Portal>
  )
}

export interface MenuItemProps extends React.ComponentPropsWithoutRef<'div'> {
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
      <div
        role="menuitem"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled ? 'true' : undefined}
        data-disabled={disabled ? '' : undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '6px 8px',
          borderRadius: 4,
          fontSize: 14,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          outline: 'none',
          userSelect: 'none',
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    </RovingFocus.Item>
  )
}

export interface MenuCheckboxItemProps extends MenuItemProps {
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
      <span style={{ width: 16, marginRight: 6 }}>{checked ? '✓' : ''}</span>
      {children}
    </MenuItem>
  )
}

export function MenuSeparator({
  className,
  style,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      role="separator"
      className={className}
      style={{
        height: 1,
        backgroundColor: '#e5e7eb',
        margin: '4px 0',
        ...style,
      }}
      {...props}
    />
  )
}

Menu.Trigger = MenuTrigger
Menu.Content = MenuContent
Menu.Item = MenuItem
Menu.CheckboxItem = MenuCheckboxItem
Menu.Separator = MenuSeparator
