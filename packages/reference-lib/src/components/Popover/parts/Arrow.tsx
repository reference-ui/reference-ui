/**
 * Popover arrow: the Overlay arrow stamped with the popover marker and an
 * edge padding that keeps it off the panel corners. Positioning comes
 * from Overlay geometry; this part adds identity and the padding default.
 */
import { type PrimitiveProps } from '@reference-ui/react'
import { Overlay } from '../../Overlay'

export type PopoverArrowProps = PrimitiveProps<'div'> & {
  edgePadding?: number
}

export function PopoverArrow({
  edgePadding = 4,
  ...props
}: PopoverArrowProps) {
  return <Overlay.Arrow data-reference-popover-arrow="" edgePadding={edgePadding} {...props} />
}
