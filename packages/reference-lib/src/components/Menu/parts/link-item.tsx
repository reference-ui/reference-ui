/**
 * Menu.LinkItem: a navigable command row. Takes href plus the shared
 * choice props; modified, middle-button, and right-button gestures
 * stay fully native with no selection or dismissal, Enter activates
 * natively through click, and Space funnels through one synthetic
 * click. Focus restore defers a frame past the anchor-focus default.
 */
import * as React from 'react'
import { A } from '@reference-ui/react'
import { useOverlay } from '../../Overlay'
import { RovingFocus } from '../../RovingFocus'
import { controlSize, controlHeightPx } from '../../../core/theme/primitives/shared'
import { useMenuLevel } from '../context'
import { restoreFocusToTrigger } from '../focus/restore'
import { rootTriggerOf } from '../levels/registry'
import type { MenuLinkItemProps } from '../types'

export const MenuLinkItem = React.forwardRef<HTMLAnchorElement, MenuLinkItemProps>(
  function MenuLinkItem(
    {
      children,
      href,
      disabled = false,
      textValue,
      onSelect,
      closeOnSelect = true,
      onClick,
      onKeyDown,
      className,
      style,
      ...props
    }: MenuLinkItemProps,
    ref
  ) {
    const overlay = useOverlay()
    const level = useMenuLevel()

    const dismissAfterSelect = React.useCallback(() => {
      // Deferred restore: the anchor-focus default lands after React's flush,
      // so both synchronous and effect restores would be clobbered. A frame
      // later the dismissal has committed and the default has run; a real
      // navigation unloads before the frame and needs no restore.
      if (level) {
        level.requestTreeDismiss()
        const rootTrigger = rootTriggerOf(level)
        requestAnimationFrame(() => {
          restoreFocusToTrigger(rootTrigger)
        })
        return
      }
      if (overlay) {
        overlay.setIsOpen(false)
        restoreFocusToTrigger(overlay.triggerRef.current as HTMLElement | null)
      }
    }, [level, overlay])

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e)
      if (disabled) {
        // Non-navigable: block every activation route after observability.
        e.preventDefault()
        return
      }
      if (e.defaultPrevented) return
      // Modified, middle-button, and right-button gestures stay fully native:
      // no selection, no dismissal.
      if (e.button !== 0) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      onSelect?.(e.nativeEvent)
      // Cancellation prevents both Menu defaults and navigation; the native
      // event is the click itself, so its prevention already blocks nav.
      if (e.nativeEvent.defaultPrevented) return
      if (closeOnSelect) dismissAfterSelect()
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>) => {
      onKeyDown?.(e)
      if (e.defaultPrevented || disabled) return
      // Enter activates natively through click; Space is Menu-owned (anchors
      // scroll natively) and funnels through one synthetic click so handlers,
      // navigation, and dismissal observe a single primary activation.
      if (e.key === ' ') {
        e.preventDefault()
        e.currentTarget.click()
      }
    }

    return (
      <RovingFocus.Item disabled={disabled} textValue={textValue}>
        <A
          role="menuitem"
          href={href}
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled ? 'true' : undefined}
          data-disabled={disabled ? '' : undefined}
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
          bg="transparent"
          color="design.text.base"
          opacity={disabled ? 0.5 : 1}
          outline="none"
          userSelect="none"
          textDecoration="none"
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
        </A>
      </RovingFocus.Item>
    )
  }
)
