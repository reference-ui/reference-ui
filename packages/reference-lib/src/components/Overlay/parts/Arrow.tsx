import * as React from 'react'
import { Div, type PrimitiveProps } from '@reference-ui/react'
import { OverlayContext } from '../context'
import { assignRef } from '../shared/refs'

export type OverlayArrowProps = PrimitiveProps<'div'> & {
  edgePadding?: number
}

export const OverlayArrow = React.forwardRef<HTMLDivElement, OverlayArrowProps>(
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
      {...props}
      data-reference-overlay-arrow=""
      data-edge-padding={edgePadding}
      ref={(node: HTMLDivElement | null) => {
        if (context) context.arrowRef.current = node
        assignRef(userRef, node)
      }}
      position="absolute"
      width="2r"
      height="2r"
      pointerEvents="none"
      className={className}
      style={style}
    />
  )
  }
)
