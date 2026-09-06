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
  const [focusStrategy, setFocusStrategy] = React.useState<'first' | 'last' | null>(null)
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
    context.setFocusStrategy(null)
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

      if (context.focusStrategy === null) {
        contentRef.current.focus({ preventScroll: true })
        return
      }

      const items = Array.from(
        contentRef.current.querySelectorAll<HTMLElement>(
          '[role="menuitem"]:not([aria-disabled="true"]):not([data-disabled])'
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
      <div ref={contentRef} tabIndex={-1} onKeyDown={handleKeyDown} style={{ outline: 'none' }}>
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
  closeOnClick?: boolean
  /** @deprecated Use closeOnClick instead */
  closeOnSelect?: boolean
}

export function MenuItem({
  children,
  disabled = false,
  selected = false,
  onSelect,
  closeOnClick = true,
  closeOnSelect,
  onClick,
  onKeyDown,
  className,
  style,
  ...props
}: MenuItemProps) {
  const context = React.useContext(MenuContext)
  const overlay = useOverlay()
  const shouldClose = closeOnSelect !== undefined ? closeOnSelect : closeOnClick

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return
    onClick?.(e)
    onSelect?.()
    if (!e.defaultPrevented && shouldClose && context) {
      context.setIsOpen(false)
      overlay?.triggerRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (!e.defaultPrevented && !disabled && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>)
      onSelect?.()
      if (shouldClose && context) {
        context.setIsOpen(false)
        overlay?.triggerRef.current?.focus()
      }
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
Menu.Separator = MenuSeparator
