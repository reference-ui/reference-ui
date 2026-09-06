import * as React from 'react'
import { Div, Span, type PrimitiveProps } from '@reference-ui/react'
import { Overlay, useOverlay, type OverlayContentProps } from '../Overlay'
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
  focusStrategy: 'first' | 'last' | null
  setFocusStrategy: React.Dispatch<React.SetStateAction<'first' | 'last' | null>>
}

const MenuContext = React.createContext<MenuContextValue | null>(null)

export function Menu({
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
}: MenuProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const [focusStrategy, setFocusStrategy] = React.useState<'first' | 'last' | null>('first')
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
      focusStrategy,
      setFocusStrategy,
    }),
    [isOpen, setIsOpen, focusStrategy]
  )

  return (
    <MenuContext.Provider value={contextValue}>
      <Overlay open={isOpen} onOpenChange={setIsOpen} isolation={false}>
        {children}
      </Overlay>
    </MenuContext.Provider>
  )
}

export type MenuTriggerProps = React.ComponentPropsWithoutRef<typeof Overlay.Trigger>

export function MenuTrigger({
  children,
  onKeyDown,
  onClick,
  ...props
}: MenuTriggerProps) {
  const context = React.useContext(MenuContext)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || !context) return

    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      context.setFocusStrategy('first')
      context.setIsOpen(true)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      context.setFocusStrategy('last')
      context.setIsOpen(true)
    }
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (e.defaultPrevented || !context) return
    context.setFocusStrategy('first')
  }

  return (
    <Overlay.Trigger
      aria-haspopup="menu"
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Overlay.Trigger>
  )
}

export type MenuContentProps = OverlayContentProps

export function MenuContent({
  children,
  className,
  style,
  onKeyDown,
  ...props
}: MenuContentProps) {
  const context = React.useContext(MenuContext)
  const overlay = useOverlay()
  const contentRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!context?.isOpen) return

    const frameId = requestAnimationFrame(() => {
      if (!contentRef.current) return
      const items = Array.from(
        contentRef.current.querySelectorAll<HTMLElement>(
          '[role="menuitem"]:not([aria-disabled="true"]):not([data-disabled]), [role="menuitemcheckbox"]:not([aria-disabled="true"]):not([data-disabled])'
        )
      )
      if (items.length === 0) return

      const target = context.focusStrategy === 'last' ? items[items.length - 1] : items[0]
      target?.focus()
    })

    return () => cancelAnimationFrame(frameId)
  }, [context?.isOpen, context?.focusStrategy])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || !context) return

    if (e.key === 'Tab') {
      context.setIsOpen(false)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      context.setIsOpen(false)
      overlay?.triggerRef.current?.focus()
    }
  }

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
      <div ref={contentRef} onKeyDown={handleKeyDown} style={{ outline: 'none' }}>
        <RovingFocus.Root orientation="vertical" loop>
          <Div display="flex" flexDirection="column" gap="0.5r" outline="none">
            {children}
          </Div>
        </RovingFocus.Root>
      </div>
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
  const overlay = useOverlay()

  const handleSelect = () => {
    if (disabled) return
    onSelect?.()
    if (closeOnSelect && context) {
      context.setIsOpen(false)
      overlay?.triggerRef.current?.focus()
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
