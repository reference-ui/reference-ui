/**
 * Tooltip arrow: the Overlay arrow stamped with the tooltip marker so
 * styles and tests can tell it apart from popover and menu arrows.
 * Positioning comes from Overlay geometry; this part adds identity only.
 */
import { type PrimitiveProps } from '@reference-ui/react'
import { Overlay } from '../../Overlay'

export type TooltipArrowProps = PrimitiveProps<'div'>

export function TooltipArrow(props: TooltipArrowProps) {
  return <Overlay.Arrow {...props} data-reference-tooltip-arrow="" />
}
