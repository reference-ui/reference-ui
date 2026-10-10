/**
 * Tooltip portal: renders tip content into the Overlay portal host so the
 * floating tip escapes ancestor clipping. A thin pass-through — placement
 * and styling belong to Content.
 */
import { Overlay } from '../../Overlay'
import { type PortalProps } from '../../Portal'

export function TooltipPortal({ children, container }: PortalProps) {
  return <Overlay.Portal container={container}>{children}</Overlay.Portal>
}
