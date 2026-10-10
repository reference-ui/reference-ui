/**
 * A nested Menu: renders no node itself, owns one submenu Overlay (one
 * child layer per open Content), and provides the child level. Takes
 * the controlled open triple; omitted open is controlled false with
 * no ephemeral submenu state. Composes the nested-level, outside-press,
 * and intent-travel hooks; portals through the parent container.
 */
import * as React from 'react'
import { Overlay, OverlayPortal, useOverlay } from '../../Overlay'
import { MenuLevelContext, useMenuLevel, type MenuLevelValue } from '../context'
import { useIntentTravel, useNestedLevel, useOutsidePress } from '../hooks'
import type { MenuProps } from '../types'

function NestedMenuInner({
  parentLevel,
  children,
}: {
  parentLevel: MenuLevelValue
  children: React.ReactNode
}) {
  const overlay = useOverlay()
  const isOpen = overlay?.isOpen ?? false
  const { levelValue, contentId, intent } = useNestedLevel({ parentLevel, overlay, isOpen })
  useOutsidePress({ isOpen, parentLevel, overlayId: overlay?.id, getTrigger: levelValue.getTrigger })
  useIntentTravel({ isOpen, intent, parentLevel, contentId, levelValue })

  return <MenuLevelContext.Provider value={levelValue}>{children}</MenuLevelContext.Provider>
}

export function NestedMenu({ open, onOpen, onDismiss, children }: MenuProps) {
  const parentLevel = useMenuLevel()
  const parentOverlay = useOverlay()
  const portalContainer = parentOverlay?.portalContainer
  if (!parentLevel) return null
  const inner = <NestedMenuInner parentLevel={parentLevel}>{children}</NestedMenuInner>
  return (
    <Overlay
      open={open ?? false}
      onOpen={onOpen}
      onDismiss={onDismiss}
      isolation={false}
    >
      {portalContainer !== undefined && portalContainer !== null ? (
        <OverlayPortal container={portalContainer}>{inner}</OverlayPortal>
      ) : (
        inner
      )}
    </Overlay>
  )
}
