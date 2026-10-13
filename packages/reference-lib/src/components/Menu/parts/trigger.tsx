/**
 * Menu.Trigger: the submenu parent row. Takes children, disabled, and
 * textValue; registers its node as the submenu Overlay's anchor with
 * a portable id-based resolution for React 17/18, opens on the
 * direction-aware arrow, Enter, Space, tap, or hover past the frozen
 * open delay, and walks out through the grace polygon on leave.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import { overlayStackStore, useOverlay } from '../../Overlay'
import { RovingFocus } from '../../RovingFocus'
import { controlSize, controlHeightPx } from '../../../core/theme/primitives/shared'
import { useMenuLevel } from '../context'
import { focusFirstEnabledItem } from '../focus/items'
import { owningScope } from '../focus/scope'
import { SUBMENU_OPEN_DELAY_MS } from '../intent/menu-intent'
import { clearIntentTimer } from '../levels/intent-state'
import { levelDirection } from '../levels/registry'
import { hoverCapablePointer } from '../shared/pointer'
import { devWarn } from '../shared/warn'
import type { MenuTriggerProps } from '../types'

export const MenuTrigger: React.ForwardRefExoticComponent<
  MenuTriggerProps & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, MenuTriggerProps>(function MenuTrigger(
  {
    children,
    disabled = false,
    textValue,
    onKeyDown,
    onClick,
    onPointerEnter,
    onPointerLeave,
    className,
    style,
    id: authoredId,
    ...props
  }: MenuTriggerProps,
  ref
) {
  const level = useMenuLevel()
  const overlay = useOverlay()
  if (!level || !level.isSubmenu) {
    devWarn('Menu.Trigger is valid only when nested inside a submenu Menu.')
  }
  const isOpen = level?.isOpen ?? false

  const generatedId = React.useId()
  const stableTriggerIdRef = React.useRef<string | null>(null)
  if (stableTriggerIdRef.current === null) {
    stableTriggerIdRef.current = `menu-trigger-${String(generatedId).replace(/[^a-zA-Z0-9_-]/g, '')}`
  }
  const triggerId = authoredId ?? stableTriggerIdRef.current

  const composedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      // The submenu Overlay anchors geometry and outside-press ownership to
      // this node, mirroring Overlay.Trigger registration without the button.
      // RovingFocus.Item drops child refs on React 17/18 (props.ref
      // stripping), so the layout resolution below is the portable path.
      if (overlay) {
        overlay.triggerRef.current = node as HTMLElement | null
        overlayStackStore.getState().setLayerTrigger(overlay.id, node)
      }
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref && typeof ref === 'object' && 'current' in ref) {
        ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = node
      }
    },
    [overlay, ref]
  )

  // Portable trigger registration: resolve the mounted node by stable id so
  // geometry, outside-press ownership, and focus restore work on React 17/18
  // where the child ref above is dropped. Follows authored id changes.
  React.useLayoutEffect(() => {
    if (!overlay || typeof document === 'undefined') return
    // Resolve in the parent level's owning root: document.getElementById
    // never sees shadow-hosted triggers (and would null a good ref on 19).
    const scope = owningScope(level?.parent?.getContentNode() ?? null) ?? document
    const node = scope.getElementById(triggerId)
    overlay.triggerRef.current = node
    overlayStackStore.getState().setLayerTrigger(overlay.id, node)
  }, [overlay, triggerId, level])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || disabled || !level || !level.isSubmenu) return
    const isRtl = levelDirection(level) === 'rtl'
    const openKey = isRtl ? 'ArrowLeft' : 'ArrowRight'
    if (e.key === openKey || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (isOpen) {
        // Open by pointer, now directed by key: move focus in once, never a
        // second open request.
        focusFirstEnabledItem(level.getContentNode())
        return
      }
      if (level.intent) level.intent.keyboardOpen = true
      level.requestOpen()
    }
  }

  const handlePointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerEnter?.(e)
    if (e.defaultPrevented || disabled || !level || !level.isSubmenu || !level.intent) return
    if (!hoverCapablePointer(e.pointerType, e.pressure)) return
    const intent = level.intent
    // Hover supersedes any stale keyboard-open flag from a rejected request.
    intent.keyboardOpen = false
    clearIntentTimer(intent, 'closeTimer')
    // Re-entry resets the away episode: a later exit requests exactly once.
    intent.closeRequested = false
    if (isOpen || intent.openTimer) return
    intent.openTimer = setTimeout(() => {
      intent.openTimer = null
      level.requestOpen()
    }, SUBMENU_OPEN_DELAY_MS)
  }

  const handlePointerLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(e)
    if (e.defaultPrevented || disabled || !level || !level.isSubmenu || !level.intent) return
    if (!hoverCapablePointer(e.pointerType, e.pressure)) return
    const intent = level.intent
    intent.leavePoint = [e.clientX, e.clientY]
    clearIntentTimer(intent, 'openTimer')
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    onClick?.(e)
    if (e.defaultPrevented || disabled || !level || !level.isSubmenu) return
    // Tap/click activation opens once; the hover timer would only duplicate.
    if (level.intent) clearIntentTimer(level.intent, 'openTimer')
    if (!isOpen) level.requestOpen()
  }

  return (
    <RovingFocus.Item disabled={disabled} textValue={textValue}>
      <Div
        role="menuitem"
        id={triggerId}
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="menu"
        aria-expanded={level?.isSubmenu ? isOpen : undefined}
        aria-controls={level?.isSubmenu && isOpen ? level.contentId : undefined}
        aria-disabled={disabled ? 'true' : undefined}
        data-disabled={disabled ? '' : undefined}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
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
        ref={composedRef}
      >
        {children}
      </Div>
    </RovingFocus.Item>
  )
})
