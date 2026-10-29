/**
 * Tooltip portal: renders tip content into the Overlay portal host so the
 * floating tip escapes ancestor clipping. A thin pass-through — placement
 * and styling belong to Content.
 */
import { Overlay } from '../../Overlay'
import { type PortalProps } from '../../Portal'

export type TooltipPortalProps = PortalProps & {
  /**
   * Element to render Content into.
   * @default the trigger's root
   */
  container?: PortalProps['container']
}

export function TooltipPortal({ children, container }: TooltipPortalProps) {
  return <Overlay.Portal container={container}>{children}</Overlay.Portal>
}
