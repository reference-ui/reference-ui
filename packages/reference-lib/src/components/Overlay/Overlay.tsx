import * as React from 'react'
import { Button, Div, type PrimitiveProps } from '@reference-ui/react'
import { Portal, type PortalProps } from '../Portal'
import { Presence } from '../Presence'
import { FocusLock } from '../FocusLock'
import {
  computePosition,
  autoUpdate,
  type Placement,
  type Strategy,
  type VirtualAnchor,
  type ReferenceType,
} from './floating'

export type OverlayPlacement = Placement
export type OverlayEdge = 'top' | 'bottom' | 'left' | 'right'

export type OverlayIsolation =
  | boolean
  | {
      focus?: boolean
      inert?: boolean
      scroll?: boolean
    }

export interface OverlayDismissHandlers {
  onDismiss?: () => void
  onEscape?: (event: KeyboardEvent) => void
  onOutsidePress?: (event: PointerEvent) => void
  onInteractOutside?: (event: PointerEvent | FocusEvent) => void
}

export interface OverlayProps extends OverlayDismissHandlers {
  children?: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpen?: () => void
  onOpenChange?: (open: boolean) => void
  isolation?: OverlayIsolation
  anchor?:
    | HTMLElement
    | VirtualAnchor
    | React.RefObject<HTMLElement | null>
    | { x: number; y: number; width?: number; height?: number }
    | null
  edge?: OverlayEdge
  closeOnScroll?: boolean
  /** When false, closed Content unmounts immediately (Tooltip). Default true. */
  presence?: boolean
}

interface OverlayContextValue {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  isolation: { focus: boolean; inert: boolean; scroll: boolean }
  anchor?: OverlayProps['anchor']
  edge?: OverlayEdge
  closeOnScroll?: boolean
  presence: boolean
  portalContainer?: PortalProps['container']
  setPortalContainer: (container: PortalProps['container']) => void
  contentRef: React.MutableRefObject<HTMLDivElement | null>
  triggerRef: React.MutableRefObject<HTMLElement | null>
  arrowRef: React.MutableRefObject<HTMLDivElement | null>
  onEscape?: (e: KeyboardEvent) => void
  onOutsidePress?: (e: PointerEvent) => void
  onInteractOutside?: (e: PointerEvent | FocusEvent) => void
  onDismiss?: () => void
  onOpen?: () => void
}

const OverlayContext = React.createContext<OverlayContextValue | null>(null)

export function useOverlay() {
  return React.useContext(OverlayContext)
}

function resolveReference(
  anchor: OverlayProps['anchor'],
  trigger: HTMLElement | null,
  isolationFocus: boolean,
  edge?: OverlayEdge
): ReferenceType | null {
  if (edge) return null

  if (anchor) {
    if (typeof anchor === 'object' && 'current' in anchor) {
      return anchor.current
    }
    if (anchor instanceof HTMLElement) {
      return anchor
    }
    if (typeof anchor === 'object' && 'getBoundingClientRect' in anchor) {
      return anchor as VirtualAnchor
    }
    if (typeof anchor === 'object' && 'x' in anchor && 'y' in anchor) {
      const point = anchor as { x: number; y: number; width?: number; height?: number }
      return {
        getBoundingClientRect: () =>
          new DOMRect(point.x, point.y, point.width ?? 0, point.height ?? 0),
      }
    }
  }

  // Trigger is the floating reference only when isolation focus is off
  // (popover/menu/tooltip). Isolating dialogs keep Trigger as opener only.
  if (trigger && !isolationFocus) {
    return trigger
  }

  return null
}

export function Overlay({
  children,
  open: openProp,
  defaultOpen = false,
  onOpen,
  onOpenChange,
  isolation: isolationProp = true,
  anchor,
  edge,
  closeOnScroll = false,
  presence = true,
  onEscape,
  onOutsidePress,
  onInteractOutside,
  onDismiss,
}: OverlayProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const isControlled = openProp !== undefined
  const isOpen = isControlled ? openProp : internalOpen

  const contentRef = React.useRef<HTMLDivElement | null>(null)
  const triggerRef = React.useRef<HTMLElement | null>(null)
  const arrowRef = React.useRef<HTMLDivElement | null>(null)
  const [portalContainer, setPortalContainer] = React.useState<
    PortalProps['container'] | undefined
  >(undefined)

  const setIsOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (nextOpen && !isOpen) {
        onOpen?.()
      }
      if (!isControlled) {
        setInternalOpen(nextOpen)
      }
      onOpenChange?.(nextOpen)
      if (!nextOpen && isOpen) {
        onDismiss?.()
      }
    },
    [isControlled, isOpen, onOpen, onOpenChange, onDismiss]
  )

  const isolation = React.useMemo(() => {
    if (typeof isolationProp === 'boolean') {
      return {
        focus: isolationProp,
        inert: isolationProp,
        scroll: isolationProp,
      }
    }
    return {
      focus: isolationProp.focus ?? true,
      inert: isolationProp.inert ?? true,
      scroll: isolationProp.scroll ?? true,
    }
  }, [isolationProp])

  React.useEffect(() => {
    if (!isOpen || !isolation.inert) return

    const overlayEl = contentRef.current
    if (!overlayEl) return

    const siblingsToInert: HTMLElement[] = []
    const rootNodes = Array.from(document.body.children) as HTMLElement[]

    for (const node of rootNodes) {
      if (node === overlayEl || node.contains(overlayEl)) continue
      if (node.hasAttribute('data-reference-overlay-backdrop')) continue
      if (node.hasAttribute('data-reference-overlay-content')) continue
      if (node.hasAttribute('data-reference-portal-container')) continue
      node.setAttribute('inert', '')
      siblingsToInert.push(node)
    }

    return () => {
      for (const node of siblingsToInert) {
        node.removeAttribute('inert')
      }
    }
  }, [isOpen, isolation.inert])

  const contextValue = React.useMemo<OverlayContextValue>(() => {
    return {
      isOpen,
      setIsOpen,
      isolation,
      anchor,
      edge,
      closeOnScroll,
      presence,
      portalContainer,
      setPortalContainer,
      contentRef,
      triggerRef,
      arrowRef,
      onEscape,
      onOutsidePress,
      onInteractOutside,
      onDismiss,
      onOpen,
    }
  }, [
    isOpen,
    setIsOpen,
    isolation,
    anchor,
    edge,
    closeOnScroll,
    presence,
    portalContainer,
    onEscape,
    onOutsidePress,
    onInteractOutside,
    onDismiss,
    onOpen,
  ])

  return (
    <OverlayContext.Provider value={contextValue}>{children}</OverlayContext.Provider>
  )
}

export type OverlayTriggerProps = PrimitiveProps<'button'>

export function OverlayTrigger({
  children,
  disabled,
  onClick,
  ...props
}: OverlayTriggerProps) {
  const context = React.useContext(OverlayContext)
  const userRef = (props as { ref?: React.Ref<HTMLButtonElement> }).ref

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (e.defaultPrevented || disabled || !context) return
    if (context.isOpen) {
      context.setIsOpen(false)
    } else {
      context.setIsOpen(true)
    }
  }

  const composedRef = (node: HTMLButtonElement | null) => {
    if (context) {
      context.triggerRef.current = node
    }
    if (typeof userRef === 'function') {
      userRef(node)
    } else if (userRef && typeof userRef === 'object' && 'current' in userRef) {
      userRef.current = node
    }
  }

  return (
    <Button
      type="button"
      {...props}
      ref={composedRef}
      disabled={disabled}
      aria-expanded={context?.isOpen}
      onClick={handleClick}
    >
      {children}
    </Button>
  )
}

export function OverlayPortal({ children, container }: PortalProps) {
  const context = React.useContext(OverlayContext)

  React.useLayoutEffect(() => {
    if (!context) return
    context.setPortalContainer(container)
    return () => {
      context.setPortalContainer(undefined)
    }
  }, [context, container])

  // Config part: never a portal wrapper. Children stay in the React tree
  // so Content/Backdrop can portal themselves.
  return <>{children}</>
}

export type OverlayBackdropProps = PrimitiveProps<'div'>

export function OverlayBackdrop({
  children,
  style,
  className,
  onClick,
  ...props
}: OverlayBackdropProps) {
  const context = React.useContext(OverlayContext)

  if (!context) return null

  const node = (
    <Presence present={context.isOpen}>
      <Div
        data-reference-overlay-backdrop=""
        data-state={context.isOpen ? 'open' : 'closed'}
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        onClick={e => {
          onClick?.(e)
          if (!e.defaultPrevented) {
            context.setIsOpen(false)
          }
        }}
        className={className}
        style={{
          position: 'fixed',
          inset: 0,
          ...style,
        }}
        {...props}
      >
        {children}
      </Div>
    </Presence>
  )

  return <Portal container={context.portalContainer}>{node}</Portal>
}

export interface OverlayContentProps
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'color' | 'content'> {
  placement?: Placement
  offset?: number
  collisionPadding?: number
  strategy?: Strategy
  flip?: boolean
  shift?: boolean
  [key: string]: any
}

export function OverlayContent({
  children,
  placement = 'bottom-start',
  offset = 8,
  collisionPadding = 8,
  strategy = 'absolute',
  flip = true,
  shift = true,
  style,
  className,
  ...props
}: OverlayContentProps) {
  const context = React.useContext(OverlayContext)
  const [mountedContent, setMountedContent] = React.useState<HTMLDivElement | null>(null)

  const isOpen = context?.isOpen ?? false
  const setIsOpen = context?.setIsOpen
  const anchor = context?.anchor
  const edge = context?.edge
  const closeOnScroll = context?.closeOnScroll
  const contentRef = context?.contentRef
  const triggerRef = context?.triggerRef
  const arrowRef = context?.arrowRef
  const isolationFocus = context?.isolation.focus ?? true

  React.useLayoutEffect(() => {
    if (!context || !isOpen || !setIsOpen || !contentRef || !triggerRef || !arrowRef) {
      return
    }
    const content = mountedContent ?? contentRef.current
    if (!content) return

    if (edge) {
      content.style.position = 'fixed'
      content.style.top = ''
      content.style.left = ''
      content.style.right = ''
      content.style.bottom = ''
      content.setAttribute('data-edge', edge)
      if (edge === 'bottom') {
        content.style.bottom = '0'
        content.style.left = '0'
        content.style.right = '0'
      } else if (edge === 'top') {
        content.style.top = '0'
        content.style.left = '0'
        content.style.right = '0'
      } else if (edge === 'left') {
        content.style.top = '0'
        content.style.bottom = '0'
        content.style.left = '0'
      } else if (edge === 'right') {
        content.style.top = '0'
        content.style.bottom = '0'
        content.style.right = '0'
      }
      return
    }

    const reference = resolveReference(
      anchor,
      triggerRef.current,
      isolationFocus,
      edge
    )

    if (!reference) {
      return
    }

    const update = () => {
      const floating = contentRef.current
      if (!reference || !floating) return
      const res = computePosition(reference, floating, {
        placement,
        strategy,
        offset,
        collisionPadding,
        flip,
        shift,
        arrow: {
          element: arrowRef.current,
        },
      })

      floating.style.position = res.strategy
      floating.style.left = `${res.x}px`
      floating.style.top = `${res.y}px`

      if (res.middlewareData.size) {
        floating.style.setProperty(
          '--reference-overlay-available-width',
          `${res.middlewareData.size.availableWidth}px`
        )
        floating.style.setProperty(
          '--reference-overlay-available-height',
          `${res.middlewareData.size.availableHeight}px`
        )
        floating.style.setProperty(
          '--reference-overlay-anchor-width',
          `${res.middlewareData.size.anchorWidth}px`
        )
        floating.style.setProperty(
          '--reference-overlay-anchor-height',
          `${res.middlewareData.size.anchorHeight}px`
        )
      }

      floating.setAttribute('data-side', res.placement.split('-')[0] ?? '')
      floating.setAttribute('data-align', res.placement.split('-')[1] || 'center')

      if (res.middlewareData.hide) {
        if (res.middlewareData.hide.referenceHidden) {
          floating.setAttribute('data-anchor-hidden', '')
        } else {
          floating.removeAttribute('data-anchor-hidden')
        }
        if (res.middlewareData.hide.escaped) {
          floating.setAttribute('data-escaped', '')
        } else {
          floating.removeAttribute('data-escaped')
        }
      }

      if (res.middlewareData.arrow && arrowRef.current) {
        const { x: arrowX, y: arrowY } = res.middlewareData.arrow
        if (arrowX !== undefined) arrowRef.current.style.left = `${arrowX}px`
        if (arrowY !== undefined) arrowRef.current.style.top = `${arrowY}px`
      }
    }

    const cleanup = autoUpdate(reference, content, update, {
      closeOnScroll,
      onScrollClose: () => setIsOpen(false),
    })

    return cleanup
  }, [
    context,
    isOpen,
    setIsOpen,
    anchor,
    edge,
    isolationFocus,
    placement,
    strategy,
    offset,
    collisionPadding,
    flip,
    shift,
    closeOnScroll,
    contentRef,
    triggerRef,
    arrowRef,
    mountedContent,
  ])

  React.useEffect(() => {
    if (!context || !isOpen || !setIsOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        context.onEscape?.(e)
        if (!e.defaultPrevented) {
          e.preventDefault()
          setIsOpen(false)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, context, setIsOpen])

  React.useEffect(() => {
    if (!context || !isOpen || !setIsOpen || !contentRef || !triggerRef) return

    let cancelled = false
    // Same-tick open race: do not dismiss from the pointer that opened us.
    const timer = window.setTimeout(() => {
      if (cancelled) return

      const handlePointerDown = (e: PointerEvent) => {
        const content = contentRef.current
        const trigger = triggerRef.current
        const target = e.target as Node | null

        if (!content || !target) return
        if (content.contains(target) || trigger?.contains(target)) return

        const targetEl = target instanceof Element ? target : target.parentElement
        if (targetEl?.closest('[data-reference-overlay-backdrop]')) {
          return
        }

        context.onOutsidePress?.(e)
        context.onInteractOutside?.(e)
        if (!e.defaultPrevented) {
          setIsOpen(false)
        }
      }

      document.addEventListener('pointerdown', handlePointerDown)
      cleanupPointer = () => {
        document.removeEventListener('pointerdown', handlePointerDown)
      }
    }, 0)

    let cleanupPointer: (() => void) | undefined

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      cleanupPointer?.()
    }
  }, [isOpen, context, contentRef, triggerRef, setIsOpen])

  React.useEffect(() => {
    if (!context || !isOpen || !context.isolation.scroll) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen, context])

  if (!context) return null

  const contentElement = (
    <Div
      data-reference-overlay-content=""
      data-state={isOpen ? 'open' : 'closed'}
      ref={(node: HTMLDivElement | null) => {
        context.contentRef.current = node
        setMountedContent(node)
      }}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </Div>
  )

  const wrappedWithFocusLock = context.isolation.focus ? (
    <FocusLock>{contentElement}</FocusLock>
  ) : (
    contentElement
  )

  const presentable = context.presence ? (
    <Presence present={isOpen}>{wrappedWithFocusLock}</Presence>
  ) : isOpen ? (
    wrappedWithFocusLock
  ) : null

  return <Portal container={context.portalContainer}>{presentable}</Portal>
}

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

  return (
    <Div
      {...props}
      data-reference-overlay-arrow=""
      data-edge-padding={edgePadding}
      ref={(node: HTMLDivElement | null) => {
        if (context) context.arrowRef.current = node
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

export type OverlayHandleProps = PrimitiveProps<'div'>

export function OverlayHandle({
  style,
  className,
  onPointerDown: userPointerDown,
  ...props
}: OverlayHandleProps) {
  const context = React.useContext(OverlayContext)
  const isDraggingRef = React.useRef(false)
  const startYRef = React.useRef(0)

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    userPointerDown?.(e)
    if (!e.defaultPrevented && context?.edge) {
      isDraggingRef.current = true
      startYRef.current = e.clientY
      const target = e.currentTarget
      target.setPointerCapture(e.pointerId)
      context.contentRef.current?.setAttribute('data-dragging', '')
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !context?.contentRef.current) return
    const deltaY = e.clientY - startYRef.current
    if (deltaY > 0) {
      const height = context.contentRef.current.offsetHeight || 300
      const progress = Math.min(1, deltaY / height)
      context.contentRef.current.style.setProperty(
        '--reference-overlay-swipe-progress',
        String(progress)
      )
      context.contentRef.current.style.transform = `translateY(${deltaY}px)`
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !context?.contentRef.current) return
    isDraggingRef.current = false
    const deltaY = e.clientY - startYRef.current
    const height = context.contentRef.current.offsetHeight || 300
    const progress = deltaY / height

    context.contentRef.current.removeAttribute('data-dragging')

    if (progress >= 0.25) {
      context.setIsOpen(false)
    } else {
      context.contentRef.current.style.transform = ''
      context.contentRef.current.style.setProperty('--reference-overlay-swipe-progress', '0')
    }
  }

  return (
    <Div
      {...props}
      data-reference-overlay-handle=""
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      width="8r"
      height="1r"
      borderRadius="full"
      bg="colors.gray.400"
      mx="auto"
      my="2r"
      cursor="grab"
      touchAction="none"
      className={className}
      style={style}
    />
  )
}

Overlay.Trigger = OverlayTrigger
Overlay.Portal = OverlayPortal
Overlay.Backdrop = OverlayBackdrop
Overlay.Content = OverlayContent
Overlay.Arrow = OverlayArrow
Overlay.Handle = OverlayHandle
