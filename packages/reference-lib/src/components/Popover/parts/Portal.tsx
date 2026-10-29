/**
 * Popover portal: renders popover content into the Overlay portal host so
 * floating content escapes ancestor clipping. A thin pass-through —
 * placement and chrome belong to Content.
 */
import { Overlay } from '../../Overlay'
import { type PortalProps } from '../../Portal'

export type PopoverPortalProps = PortalProps & {
  /**
   * Element to render Content into.
   * @default the trigger's root
   */
  container?: PortalProps['container']
}

export function PopoverPortal({ children, container }: PopoverPortalProps) {
  return <Overlay.Portal container={container}>{children}</Overlay.Portal>
}
