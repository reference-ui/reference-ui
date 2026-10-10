/**
 * Combobox's popover part: the Overlay.Content popup shell. It registers
 * the popover id, clears pointer-derived active on leave, holds focus
 * on inside mousedown so chrome gestures never read as outside blur,
 * portals into the source's ShadowRoot when nested, and derives the
 * grid role and busy state for adapter popovers. One presentational
 * shell — collection behavior lives in the nested Listbox, Tree, or
 * grid cells.
 */
import * as React from 'react'
import { Overlay, useOverlay } from '../../Overlay'
import { ComboboxContext, shadowContainerForSource } from '../combobox-context'
import type { ComboboxPopoverProps } from '../types'

export function ComboboxPopover({
  children,
  style,
  id: idProp,
  onMouseLeave,
  onPointerLeave,
  onMouseDown,
  virtualFocus: _virtualFocus,
  ...props
}: ComboboxPopoverProps) {
  const context = React.useContext(ComboboxContext)
  const overlay = useOverlay()
  const registerPopover = context?.registerPopover

  React.useLayoutEffect(() => {
    if (registerPopover) return registerPopover(idProp)
  }, [registerPopover, idProp])

  // #9: leaving the popover clears pointer-derived active only (Combobox
  // half of the joint seam; Listbox root leave targets the same state).
  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    onMouseLeave?.(e)
    context?.clearPointerActive()
  }
  const handlePointerLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(e)
    context?.clearPointerActive()
  }

  // #3: mousedown inside the popover (chrome, scrollbars) must not move
  // focus — otherwise blur fires with a null relatedTarget and a true
  // inside gesture reads as outside. Options already prevent their own
  // press; clicks still dispatch.
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    onMouseDown?.(e)
    if (!e.defaultPrevented) {
      e.preventDefault()
    }
  }

  // PATCHES #1 (CB-ENV-03): when the focus source lives in an open
  // ShadowRoot, portal the popover into that same root. Light-DOM
  // sources leave the default body destination untouched.
  const sourceRef = context?.sourceRef
  const popoverOpen = context?.isOpen
  React.useLayoutEffect(() => {
    const container = shadowContainerForSource(sourceRef?.current)
    if (container) overlay?.setPortalContainer(container)
  }, [overlay, sourceRef, popoverOpen])

  const id = idProp ?? context?.popoverId

  // #5 (CB-DOM-04): role="grid" comes only from an effective adapter
  // (conflicts resolve to null, so presentation survives ADAPTER-08).
  // Nested Listbox/Tree supply their own roles; nothing is invented.
  const popoverRole = context?.virtualAdapter ? 'grid' : 'presentation'
  // FEATURES #4: a grid popover IS the collection, so it carries busy
  // directly. Nested listbox/tree nodes get theirs from the root's sync
  // effect (frozen parts, no prop channel).
  const popoverBusy = context?.loading === true && popoverRole === 'grid'

  return (
    <Overlay.Content
      data-reference-combobox-popover=""
      role={popoverRole}
      aria-busy={popoverBusy || undefined}
      placement="bottom-start"
      p="1r"
      bg="ui.dialog.background"
      color="ui.dialog.foreground"
      borderRadius="md"
      border="1px solid"
      borderColor="ui.dialog.border"
      boxShadow="0 4px 16px rgba(0,0,0,0.12)"
      id={id}
      style={{
        minWidth: 'var(--reference-overlay-anchor-width, 12.5rem)',
        ...style,
      }}
      {...props}
      onMouseLeave={handleMouseLeave}
      onPointerLeave={handlePointerLeave}
      onMouseDown={handleMouseDown}
    >
      {children}
    </Overlay.Content>
  )
}
