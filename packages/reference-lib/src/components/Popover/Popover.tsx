import * as React from 'react'
import { Overlay, type OverlayProps } from '../Overlay'
import { Portal, type PortalProps } from '../Portal'

export interface PopoverProps extends Omit<OverlayProps, 'isolation'> {
  openOnHover?: boolean
  openDelay?: number
  closeDelay?: number
}

interface PopoverContextValue {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  openOnHover: boolean
  openDelay: number
  closeDelay: number
  triggerRef: React.MutableRefObject<HTMLElement | null>
  contentRef: React.MutableRefObject<HTMLDivElement | null>
  contentId: string
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null)

let popoverIdCounter = 0

export function Popover({
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  openOnHover = false,
  openDelay = 700,
  closeDelay = 300,
  ...overlayProps
}: PopoverProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const isControlled = openProp !== undefined
  const isOpen = isControlled ? openProp : internalOpen

  const triggerRef = React.useRef<HTMLElement | null>(null)
  const contentRef = React.useRef<HTMLDivElement | null>(null)

  const contentIdRef = React.useRef<string | null>(null)
  if (!contentIdRef.current) {
    contentIdRef.current = `popover-content-${++popoverIdCounter}`
  }

  const setIsOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen)
      }
      onOpenChange?.(nextOpen)
    },
    [isControlled, onOpenChange]
  )

  const contextValue = React.useMemo<PopoverContextValue>(() => {
    return {
      isOpen,
      setIsOpen,
      openOnHover,
      openDelay,
      closeDelay,
      triggerRef,
      contentRef,
      contentId: contentIdRef.current!,
    }
  }, [isOpen, setIsOpen, openOnHover, openDelay, closeDelay])

  return (
    <PopoverContext.Provider value={contextValue}>
      <Overlay
        open={isOpen}
        onOpenChange={setIsOpen}
        isolation={false}
        {...overlayProps}
      >
        {children}
      </Overlay>
    </PopoverContext.Provider>
  )
}

export function PopoverTrigger({
  children,
  id,
  ...props
}: React.ComponentPropsWithoutRef<'button'>) {
  const context = React.useContext(PopoverContext)
  const hoverTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const handlePointerEnter = (e: React.PointerEvent<HTMLButtonElement>) => {
    props.onPointerEnter?.(e)
    if (context?.openOnHover) {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = setTimeout(() => {
        context.setIsOpen(true)
      }, context.openDelay)
    }
  }

  const handlePointerLeave = (e: React.PointerEvent<HTMLButtonElement>) => {
    props.onPointerLeave?.(e)
    if (context?.openOnHover) {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = setTimeout(() => {
        context.setIsOpen(false)
      }, context.closeDelay)
    }
  }

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
    <button
      type="button"
      id={id}
      aria-haspopup="dialog"
      aria-expanded={context?.isOpen}
      aria-controls={context?.isOpen ? context.contentId : undefined}
      {...props}
      ref={composedRef}
      onClick={handleClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      {children}
    </button>
  )
}

export function PopoverPortal({ children, container }: PortalProps) {
  return <Portal container={container}>{children}</Portal>
}

export function PopoverContent({
  children,
  id,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const context = React.useContext(PopoverContext)
  if (!context) return null

  const contentId = id ?? context.contentId

  return (
    <Overlay.Content
      id={contentId}
      role="dialog"
      tabIndex={-1}
      data-side="bottom"
      data-align="start"
      {...props}
    >
      {children}
    </Overlay.Content>
  )
}

export function PopoverArrow({
  edgePadding = 4,
  ...props
}: React.ComponentPropsWithoutRef<'div'> & { edgePadding?: number }) {
  return <Overlay.Arrow data-reference-popover-arrow="" edgePadding={edgePadding} {...props} />
}

export function PopoverClose({
  children,
  ...props
}: React.ComponentPropsWithoutRef<'button'>) {
  const context = React.useContext(PopoverContext)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    props.onClick?.(e)
    if (!e.defaultPrevented && context) {
      context.setIsOpen(false)
    }
  }

  return (
    <button type="button" {...props} onClick={handleClick}>
      {children}
    </button>
  )
}

Popover.Trigger = PopoverTrigger
Popover.Portal = PopoverPortal
Popover.Content = PopoverContent
Popover.Arrow = PopoverArrow
Popover.Close = PopoverClose
