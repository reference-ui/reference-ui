import * as React from 'react'
import { Div, type PrimitiveProps } from '@reference-ui/react'
import { Portal } from '../../Portal'
import { Presence } from '../../Presence'
import { OverlayContext } from '../context'
import { overlayStackStore, isTopLiveLayer, useOverlayZIndex } from '../stack'
import { assignRef } from '../refs'
import { isPrimaryPointer } from '../events'

export type OverlayBackdropProps = PrimitiveProps<'div'>

export function OverlayBackdrop({
  children,
  style,
  className,
  onClick,
  onPointerDown,
  ...props
}: OverlayBackdropProps) {
  const context = React.useContext(OverlayContext)
  const zIndex = useOverlayZIndex(context?.id ?? '') - 1
  const userRef = (props as { ref?: React.Ref<HTMLDivElement> }).ref

  if (!context) return null

  const node = (
    <Presence present={context.isOpen}>
      <Div
        data-reference-overlay-backdrop=""
        data-state={context.isOpen ? 'open' : 'closed'}
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        onPointerDown={e => {
          onPointerDown?.(e)
          if (e.defaultPrevented || !isPrimaryPointer(e.nativeEvent)) return
          const top = isTopLiveLayer(
            overlayStackStore.getState().layers,
            context.id,
            e.currentTarget.ownerDocument
          )
          if (!top) return
          context.onOutsidePress?.(e.nativeEvent)
          context.onInteractOutside?.(e.nativeEvent)
          if (!e.nativeEvent.defaultPrevented) {
            context.setIsOpen(false)
          }
        }}
        onClick={onClick}
        className={className}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex,
          ...style,
        }}
        ref={(el: HTMLDivElement | null) => {
          overlayStackStore.getState().setLayerBackdrop(context.id, el)
          assignRef(userRef, el)
        }}
        {...props}
      >
        {children}
      </Div>
    </Presence>
  )

  return <Portal container={context.portalContainer}>{node}</Portal>
}
