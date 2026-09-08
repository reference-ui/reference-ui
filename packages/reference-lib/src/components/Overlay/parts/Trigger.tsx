import * as React from 'react'
import { Button, type PrimitiveProps } from '@reference-ui/react'
import { OverlayContext } from '../context'
import { overlayStackStore } from '../stack'
import { assignRef } from '../shared/refs'

export type OverlayTriggerProps = PrimitiveProps<'button'>

export function OverlayTrigger({
  children,
  disabled,
  onClick,
  ...props
}: OverlayTriggerProps) {
  const context = React.useContext(OverlayContext)
  const userRef = (props as { ref?: React.Ref<HTMLButtonElement> }).ref

  React.useLayoutEffect(() => {
    return context?.registerPart('trigger')
  }, [context])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (e.defaultPrevented || disabled || !context || context.isCorrupted) return
    context.setIsOpen(!context.isOpen)
  }

  const composedRef = (node: HTMLButtonElement | null) => {
    if (context) {
      context.triggerRef.current = node
      overlayStackStore.getState().setLayerTrigger(context.id, node)
    }
    assignRef(userRef, node)
  }

  return (
    <Button
      type="button"
      {...props}
      ref={composedRef}
      disabled={disabled}
      data-reference-overlay-trigger={context?.id}
      aria-expanded={context?.isOpen}
      onClick={handleClick}
    >
      {children}
    </Button>
  )
}
