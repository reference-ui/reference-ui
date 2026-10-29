/**
 * Popover's public prop contract: the Overlay surface minus isolation and
 * edge (a popover never traps), plus the hover-card vocabulary — the
 * `openOnHover` switch and its open/close delays. Kept free of JSX and
 * logic so stories, tests, and consumers can import the shape without
 * mounting anything.
 */
import type { OverlayAnchor, OverlayProps } from '../Overlay'

export interface PopoverProps extends Omit<OverlayProps, 'isolation' | 'edge'> {
  /** Controlled open state. Omit it to let Popover manage its own. */
  open?: boolean
  /**
   * Open state on first render when `open` is omitted.
   * @default false
   */
  defaultOpen?: boolean
  /** Called on every open and close request. */
  onOpenChange?: (open: boolean) => void
  /** Called when the popover opens. */
  onOpen?: () => void
  /** Called when the popover closes. */
  onDismiss?: () => void
  /**
   * Also open on pointer hover and keyboard focus.
   * @default false
   */
  openOnHover?: boolean
  /**
   * Milliseconds of hover before it opens, with `openOnHover`.
   * @default 700
   */
  openDelay?: number
  /**
   * Milliseconds before it closes after the pointer leaves, with `openOnHover`.
   * @default 300
   */
  closeDelay?: number
  /**
   * What Content is positioned against.
   * @default the trigger
   */
  anchor?: OverlayAnchor
  /**
   * Close when an ancestor of the anchor scrolls. Otherwise Content follows it.
   * @default false
   */
  closeOnScroll?: boolean
  /**
   * When `false`, Content unmounts as soon as it closes.
   * @default true
   */
  presence?: boolean
  /** Called on Escape. `preventDefault()` keeps it open. */
  onEscape?: (event: KeyboardEvent) => void
  /** Called on a press outside. `preventDefault()` keeps it open. */
  onOutsidePress?: (event: PointerEvent) => void
  /** Called with the same outside press. `preventDefault()` keeps it open. */
  onInteractOutside?: (event: PointerEvent | FocusEvent) => void
}
