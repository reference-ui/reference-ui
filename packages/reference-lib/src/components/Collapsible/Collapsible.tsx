import * as React from 'react'
import { Button, Div, type PrimitiveProps } from '@reference-ui/react'
import { Presence } from '../Presence'

export interface CollapsibleProps {
  children?: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
}

interface CollapsibleContextValue {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  disabled: boolean
  contentId: string
  setContentId: (id: string) => void
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(null)

let collapsibleIdCounter = 0

export function Collapsible({
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
}: CollapsibleProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const isControlled = openProp !== undefined
  const isOpen = isControlled ? openProp : internalOpen

  const generatedContentIdRef = React.useRef<string | null>(null)
  if (!generatedContentIdRef.current) {
    generatedContentIdRef.current = `collapsible-content-${++collapsibleIdCounter}`
  }

  const [explicitContentId, setExplicitContentId] = React.useState<string | null>(null)
  const contentId = explicitContentId ?? generatedContentIdRef.current

  const setIsOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen)
      }
      onOpenChange?.(nextOpen)
    },
    [isControlled, onOpenChange]
  )

  const contextValue = React.useMemo<CollapsibleContextValue>(() => {
    return {
      isOpen,
      setIsOpen,
      disabled,
      contentId,
      setContentId: setExplicitContentId,
    }
  }, [isOpen, setIsOpen, disabled, contentId])

  return (
    <CollapsibleContext.Provider value={contextValue}>
      {children}
    </CollapsibleContext.Provider>
  )
}

export type CollapsibleTriggerProps = PrimitiveProps<'button'>

export function CollapsibleTrigger({
  children,
  onClick,
  disabled: disabledProp,
  type = 'button',
  ...props
}: CollapsibleTriggerProps) {
  const context = React.useContext(CollapsibleContext)
  const isDisabled = disabledProp ?? context?.disabled ?? false
  const isOpen = context?.isOpen ?? false

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (!e.defaultPrevented && !isDisabled && context) {
      context.setIsOpen(!context.isOpen)
    }
  }

  return (
    <Button
      type={type}
      aria-expanded={isOpen}
      aria-controls={isOpen ? context?.contentId : undefined}
      data-state={isOpen ? 'open' : 'closed'}
      data-disabled={isDisabled ? '' : undefined}
      disabled={isDisabled}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Button>
  )
}

export type CollapsibleContentProps = PrimitiveProps<'div'>

export function CollapsibleContent({
  children,
  id: idProp,
  ...props
}: CollapsibleContentProps) {
  const context = React.useContext(CollapsibleContext)
  const setContentId = context?.setContentId

  React.useEffect(() => {
    if (idProp && setContentId) {
      setContentId(idProp)
      return () => setContentId(null as any)
    }
  }, [idProp, setContentId])

  if (!context) return null

  const contentId = idProp ?? context.contentId

  return (
    <Presence present={context.isOpen}>
      <Div
        id={contentId}
        data-state={context.isOpen ? 'open' : 'closed'}
        data-disabled={context.disabled ? '' : undefined}
        {...props}
      >
        {children}
      </Div>
    </Presence>
  )
}

Collapsible.Trigger = CollapsibleTrigger
Collapsible.Content = CollapsibleContent
