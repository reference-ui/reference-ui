import * as React from 'react'
import { Div, type PrimitiveProps } from '@reference-ui/react'
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
  contentId: string | null
  setContentId: (id: string | null) => void
}

const MenuContext = React.createContext<MenuContextValue | null>(null)

function restoreFocusToTrigger(
  trigger: HTMLElement | null | undefined,
  fallback: HTMLElement | null | undefined = null
) {
  if (
    trigger &&
    trigger.isConnected &&
    !trigger.hasAttribute('disabled') &&
    trigger.getAttribute('aria-disabled') !== 'true'
  ) {
    trigger.focus()
    return
  }
  if (fallback && fallback.isConnected) {
    fallback.focus()
  }
}

function findNextTabbable(from: HTMLElement, reverse = false): HTMLElement | null {
  const allTabbables = Array.from(
    document.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter(el => el.offsetParent !== null || el.offsetWidth > 0)

  const index = allTabbables.indexOf(from)
  if (index === -1) return null
  return reverse ? (allTabbables[index - 1] ?? null) : (allTabbables[index + 1] ?? null)
}

export function Menu({
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
}: MenuProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const [focusStrategy, setFocusStrategy] = React.useState<'first' | 'last' | null>(null)
  const [contentId, setContentId] = React.useState<string | null>(null)
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
      contentId,
      setContentId,
    }),
    [isOpen, setIsOpen, focusStrategy, contentId]
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

export const MenuTrigger = React.forwardRef<HTMLButtonElement, MenuTriggerProps>(function MenuTrigger(
  { children, onKeyDown, onClick, ...props }: MenuTriggerProps,
  ref
) {
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

  // Overlay.Trigger reads props.ref (ref-as-prop); its public type omits ref,
  // so deliver it through a spread variable instead of a direct attribute.
  const triggerProps = { ...props, ref: ref as React.Ref<HTMLButtonElement> }

  return (
    <Overlay.Trigger
      aria-haspopup="menu"
      aria-controls={context?.isOpen ? (context.contentId ?? undefined) : undefined}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      {...triggerProps}
    >
      {children}
    </Overlay.Trigger>
  )
})

export type MenuContentProps = OverlayContentProps

export const MenuContent = React.forwardRef<HTMLDivElement, MenuContentProps>(function MenuContent(
  { children, className, style, onKeyDown, id: authoredId, ...props }: MenuContentProps,
  ref
) {
  const context = React.useContext(MenuContext)
  const overlay = useOverlay()
  const contentRef = React.useRef<HTMLDivElement | null>(null)
  const generatedId = React.useId()
  // The React 17 CT shim returns a fresh id every render; capture the first
  // one. Real useId (18/19) is already stable, so this is a no-op there.
  const stableIdRef = React.useRef<string | null>(null)
  if (stableIdRef.current === null) {
    stableIdRef.current = generatedId
  }
  const contentId = authoredId ?? stableIdRef.current
  const setContentId = context?.setContentId

  React.useLayoutEffect(() => {
    if (!setContentId) return
    setContentId(contentId)
    return () => setContentId(null)
  }, [setContentId, contentId])

  const composedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref && typeof ref === 'object' && 'current' in ref) {
        ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = node
      }
    },
    [ref]
  )

  // Overlay.Content reads props.ref (ref-as-prop); its public type omits ref,
  // so deliver it through a spread variable instead of a direct attribute.
  const contentProps = { ...props, ref: composedRef as React.Ref<HTMLDivElement> }

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

  const wasOpenRef = React.useRef(context?.isOpen ?? false)
  React.useEffect(() => {
    const wasOpen = wasOpenRef.current
    wasOpenRef.current = context?.isOpen ?? false
    if (!wasOpen || context?.isOpen) return
    if (contentRef.current?.contains(document.activeElement)) {
      restoreFocusToTrigger(overlay?.triggerRef.current as HTMLElement | null)
    }
  })

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || !context) return

    if (e.key === 'Tab') {
      e.preventDefault()
      context.setIsOpen(false)
      const trigger = overlay?.triggerRef.current as HTMLElement | null
      const next = trigger ? findNextTabbable(trigger, e.shiftKey) : null
      if (next) {
        next.focus()
      } else {
        restoreFocusToTrigger(trigger)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      context.setIsOpen(false)
      restoreFocusToTrigger(overlay?.triggerRef.current as HTMLElement | null)
    }
  }

  return (
    <Overlay.Content
      role="menu"
      id={contentId}
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
      className={className}
      style={style}
      {...contentProps}
    >
      <div ref={contentRef} tabIndex={-1} onKeyDown={handleKeyDown} style={{ outline: 'none' }}>
        <RovingFocus.Root orientation="vertical" loop typeahead>
          <Div display="flex" flexDirection="column" gap="0.5r" outline="none">
            {children}
          </Div>
        </RovingFocus.Root>
      </div>
    </Overlay.Content>
  )
})

export type MenuItemProps = Omit<PrimitiveProps<'div'>, 'onSelect'> & {
  disabled?: boolean
  selected?: boolean
  textValue?: string
  onSelect?: (event: Event) => void
  closeOnClick?: boolean
  /** @deprecated Use closeOnClick instead */
  closeOnSelect?: boolean
}

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
  const context = React.useContext(MenuContext)
  const overlay = useOverlay()
  const shouldClose = closeOnSelect !== undefined ? closeOnSelect : closeOnClick

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) {
      e.preventDefault()
      return
    }
    onClick?.(e)
    if (e.defaultPrevented) return
    onSelect?.(e.nativeEvent)
    if (e.nativeEvent.defaultPrevented) return
    if (shouldClose && context) {
      context.setIsOpen(false)
      restoreFocusToTrigger(overlay?.triggerRef.current as HTMLElement | null)
    }
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
      if (shouldClose && context) {
        context.setIsOpen(false)
        restoreFocusToTrigger(overlay?.triggerRef.current as HTMLElement | null)
      }
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

export type MenuSeparatorProps = PrimitiveProps<'div'>

export const MenuSeparator = React.forwardRef<HTMLDivElement, MenuSeparatorProps>(
  function MenuSeparator({ className, style, ...props }: MenuSeparatorProps, ref) {
    return (
      <Div
        role="separator"
        height="1px"
        bg="ui.hr.border"
        my="1r"
        className={className}
        style={style}
        {...props}
        ref={ref}
      />
    )
  }
)

Menu.Trigger = MenuTrigger
Menu.Content = MenuContent
Menu.Item = MenuItem
Menu.Separator = MenuSeparator
