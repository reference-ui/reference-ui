import * as React from 'react'
import { Button, type PrimitiveProps } from '@reference-ui/react'
import {
  Overlay,
  useOverlay,
  type OverlayProps,
  type OverlayContentProps,
  type OverlayTriggerProps,
} from '../Overlay'
import { type PortalProps } from '../Portal'

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
  contentId: string
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null)

let popoverIdCounter = 0

export function Popover({
  children,
  open: openProp,
  defaultOpen = false,
  onOpen,
  onOpenChange,
  onDismiss,
  openOnHover = false,
  openDelay = 700,
  closeDelay = 300,
  ...overlayProps
}: PopoverProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const isControlled = openProp !== undefined
  const isOpen = isControlled ? openProp : internalOpen

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
      contentId: contentIdRef.current!,
    }
  }, [isOpen, setIsOpen, openOnHover, openDelay, closeDelay])

  return (
    <PopoverContext.Provider value={contextValue}>
      <Overlay
        open={isOpen}
        onOpen={onOpen}
        onDismiss={onDismiss}
        onOpenChange={setIsOpen}
        isolation={false}
        {...overlayProps}
      >
        {children}
      </Overlay>
    </PopoverContext.Provider>
  )
}

export type PopoverTriggerProps = OverlayTriggerProps

export function PopoverTrigger({
  children,
  id,
  onPointerEnter,
  onPointerLeave,
  ...props
}: PopoverTriggerProps) {
  const context = React.useContext(PopoverContext)
  const overlay = useOverlay()
  const hoverTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const handlePointerEnter = (e: React.PointerEvent<HTMLButtonElement>) => {
    onPointerEnter?.(e)
    if (!context?.openOnHover || e.defaultPrevented) return
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    hoverTimerRef.current = setTimeout(() => {
      overlay?.setIsOpen(true)
    }, context.openDelay)
  }

  const handlePointerLeave = (e: React.PointerEvent<HTMLButtonElement>) => {
    onPointerLeave?.(e)
    if (!context?.openOnHover || e.defaultPrevented) return
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    hoverTimerRef.current = setTimeout(() => {
      overlay?.setIsOpen(false)
    }, context.closeDelay)
  }

  React.useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    }
  }, [])

  return (
    <Overlay.Trigger
      id={id}
      aria-haspopup="dialog"
      aria-controls={context?.isOpen ? context.contentId : undefined}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      {...props}
    >
      {children}
    </Overlay.Trigger>
  )
}

export function PopoverPortal({ children, container }: PortalProps) {
  return <Overlay.Portal container={container}>{children}</Overlay.Portal>
}

export type PopoverContentProps = OverlayContentProps

export function PopoverContent({
  children,
  id,
  ...props
}: PopoverContentProps) {
  const context = React.useContext(PopoverContext)
  if (!context) return null

  const contentId = id ?? context.contentId

  return (
    <Overlay.Content
      id={contentId}
      role="dialog"
      tabIndex={-1}
      {...props}
    >
      {children}
    </Overlay.Content>
  )
}

export type PopoverArrowProps = PrimitiveProps<'div'> & {
  edgePadding?: number
}

export function PopoverArrow({
  edgePadding = 4,
  ...props
}: PopoverArrowProps) {
  return <Overlay.Arrow data-reference-popover-arrow="" edgePadding={edgePadding} {...props} />
}

export type PopoverCloseProps = PrimitiveProps<'button'>

export function PopoverClose({
  children,
  ...props
}: PopoverCloseProps) {
  const overlay = useOverlay()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    props.onClick?.(e)
    if (!e.defaultPrevented) {
      overlay?.setIsOpen(false)
    }
  }

  return (
    <Button type="button" {...props} onClick={handleClick}>
      {children}
    </Button>
  )
}

Popover.Trigger = PopoverTrigger
Popover.Portal = PopoverPortal
Popover.Content = PopoverContent
Popover.Arrow = PopoverArrow
Popover.Close = PopoverClose
