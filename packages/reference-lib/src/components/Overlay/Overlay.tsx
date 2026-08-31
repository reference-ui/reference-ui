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
  anchor?: HTMLElement | VirtualAnchor | React.RefObject<HTMLElement | null> | null
  edge?: OverlayEdge
  closeOnScroll?: boolean
}

interface OverlayContextValue {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  isolation: { focus: boolean; inert: boolean; scroll: boolean }
  anchor?: HTMLElement | VirtualAnchor | React.RefObject<HTMLElement | null> | null
  edge?: OverlayEdge
  closeOnScroll?: boolean
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
      focus: isolationProp.focus ?? false,
      inert: isolationProp.inert ?? false,
      scroll: isolationProp.scroll ?? false,
    }
  }, [isolationProp])

  // Native inert management on non-overlay DOM nodes
  React.useEffect(() => {
    if (!isOpen || !isolation.inert) return

    const overlayEl = contentRef.current
    if (!overlayEl) return

    const siblingsToInert: HTMLElement[] = []
    const rootNodes = Array.from(document.body.children) as HTMLElement[]

    for (const node of rootNodes) {
      if (node !== overlayEl && !node.contains(overlayEl) && !node.hasAttribute('data-reference-portal-container')) {
        const prevInert = node.getAttribute('inert')
        node.setAttribute('inert', '')
        siblingsToInert.push(node)
      }
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
    onEscape,
    onOutsidePress,
    onInteractOutside,
    onDismiss,
    onOpen,
  ])

  return (
    <OverlayContext.Provider value={contextValue}>
      {children}
    </OverlayContext.Provider>
  )
}

export type OverlayTriggerProps = PrimitiveProps<'button'>

export function OverlayTrigger({
  children,
  ...props
}: OverlayTriggerProps) {
  const context = React.useContext(OverlayContext)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    props.onClick?.(e)
    if (!e.defaultPrevented && context) {
      context.setIsOpen(!context.isOpen)
    }
  }

  const composedRef = (node: HTMLButtonElement | null) => {
    if (context) {
      context.triggerRef.current = node
    }
  }

  return (
    <Button
      type="button"
      {...props}
      ref={composedRef}
      aria-expanded={context?.isOpen}
      onClick={handleClick}
    >
      {children}
    </Button>
  )
}

export function OverlayPortal({ children, container }: PortalProps) {
  return <Portal container={container}>{children}</Portal>
}

export type OverlayBackdropProps = PrimitiveProps<'div'>

export function OverlayBackdrop({
  children,
  style,
  className,
  ...props
}: OverlayBackdropProps) {
  const context = React.useContext(OverlayContext)
  if (!context) return null

  return (
    <Presence present={context.isOpen}>
      <Div
        data-reference-overlay-backdrop=""
        data-state={context.isOpen ? 'open' : 'closed'}
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="rgba(0, 0, 0, 0.4)"
        zIndex={40}
        onClick={e => {
          props.onClick?.(e)
          if (!e.defaultPrevented) {
            context.setIsOpen(false)
          }
        }}
        className={className}
        style={style}
        {...props}
      >
        {children}
      </Div>
    </Presence>
  )
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
  if (!context) return null

  const { isOpen, setIsOpen, anchor, edge, closeOnScroll, contentRef, triggerRef, arrowRef } = context

  // 1. Floating positioning calculation & autoUpdate
  React.useEffect(() => {
    if (!isOpen) return
    const content = contentRef.current
    if (!content) return

    // Unbound or edge: don't compute anchored Floating UI coordinates
    if (edge) {
      content.style.position = 'fixed'
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

    // Resolve reference element
    let reference: ReferenceType | null = null
    if (anchor) {
      if ('current' in anchor) {
        reference = anchor.current
      } else {
        reference = anchor as ReferenceType
      }
    } else if (triggerRef.current) {
      reference = triggerRef.current
    }

    if (!reference) return

    const update = () => {
      if (!reference || !contentRef.current) return
      const res = computePosition(reference, contentRef.current, {
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

      contentRef.current.style.position = res.strategy
      contentRef.current.style.left = `${res.x}px`
      contentRef.current.style.top = `${res.y}px`

      // CSS variables publishing
      if (res.middlewareData.size) {
        contentRef.current.style.setProperty(
          '--reference-overlay-available-width',
          `${res.middlewareData.size.availableWidth}px`
        )
        contentRef.current.style.setProperty(
          '--reference-overlay-available-height',
          `${res.middlewareData.size.availableHeight}px`
        )
        contentRef.current.style.setProperty(
          '--reference-overlay-anchor-width',
          `${res.middlewareData.size.anchorWidth}px`
        )
        contentRef.current.style.setProperty(
          '--reference-overlay-anchor-height',
          `${res.middlewareData.size.anchorHeight}px`
        )
      }

      contentRef.current.setAttribute('data-side', res.placement.split('-')[0])
      contentRef.current.setAttribute('data-align', res.placement.split('-')[1] || 'center')

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
    isOpen,
    anchor,
    edge,
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
    setIsOpen,
  ])

  // 2. Escape key handler
  React.useEffect(() => {
    if (!isOpen) return

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

  // 3. Outside pointer interaction handler
  React.useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (e: PointerEvent) => {
      const content = contentRef.current
      const trigger = triggerRef.current
      const target = e.target as Node | null

      if (!content || !target) return
      if (content.contains(target) || trigger?.contains(target)) return

      context.onOutsidePress?.(e)
      context.onInteractOutside?.(e)
      if (!e.defaultPrevented) {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [isOpen, context, contentRef, triggerRef, setIsOpen])

  // 4. Scroll lock for isolating overlays
  React.useEffect(() => {
    if (!isOpen || !context.isolation.scroll) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen, context.isolation.scroll])

  const contentElement = (
    <Div
      data-reference-overlay-content=""
      data-state={isOpen ? 'open' : 'closed'}
      ref={node => {
        contentRef.current = node
      }}
      zIndex={50}
      bg="ui.dialog.background"
      color="ui.dialog.foreground"
      borderRadius="md"
      border="1px solid"
      borderColor="ui.dialog.border"
      boxShadow="0 4px 20px rgba(0,0,0,0.15)"
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

  return (
    <Presence present={isOpen}>
      {wrappedWithFocusLock}
    </Presence>
  )
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
      ref={node => {
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
      context.contentRef.current.style.setProperty('--reference-overlay-swipe-progress', String(progress))
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
