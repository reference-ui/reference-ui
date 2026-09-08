import * as React from 'react'
import { Div, type PrimitiveProps } from '@reference-ui/react'
import { OverlayContext } from '../context'
import { assignRef } from '../refs'

export type OverlayArrowProps = PrimitiveProps<'div'> & {
  edgePadding?: number
}

export function OverlayArrow({
  edgePadding = 4,
  style,
  className,
  ...props
}: OverlayArrowProps) {
  const context = React.useContext(OverlayContext)
  const userRef = (props as { ref?: React.Ref<HTMLDivElement> }).ref

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
