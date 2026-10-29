/**
 * Positioned arrow pointing at the trigger. Registers the arrow part,
 * publishes its node for geometry to read, and renders a styleable box —
 * the nub shape and rotation stay in application CSS.
 */
import * as React from 'react'
import { Div, type PrimitiveProps } from '@reference-ui/react'
import { OverlayContext } from '../context'
import { assignRef } from '../shared/refs'

export type OverlayArrowProps = PrimitiveProps<'div'> & {
  /**
   * Closest the arrow gets to a corner of Content, in pixels.
   * @default 4
   */
  edgePadding?: number
}

export const OverlayArrow: React.ForwardRefExoticComponent<
  OverlayArrowProps & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, OverlayArrowProps>(
  function OverlayArrow(
    {
      edgePadding = 4,
      style,
      className,
      ...props
    }: OverlayArrowProps,
    forwardedRef
  ) {
  const context = React.useContext(OverlayContext)
  const propsRef = (props as { ref?: React.Ref<HTMLDivElement> }).ref
  const userRef = forwardedRef ?? propsRef

  React.useLayoutEffect(() => {
    return context?.registerPart('arrow')
  }, [context])

  return (
    <Div
      position="absolute"
      width="2r"
      height="2r"
      pointerEvents="none"
      {...props}
      data-reference-overlay-arrow=""
      data-edge-padding={edgePadding}
      ref={(node: HTMLDivElement | null) => {
        if (context) context.arrowRef.current = node
        assignRef(userRef, node)
      }}
      className={className}
      style={style}
    />
  )
  }
)
