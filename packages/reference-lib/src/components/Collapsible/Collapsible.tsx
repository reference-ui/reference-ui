import * as React from 'react'
import { Button, Div, type PrimitiveProps } from '@reference-ui/react'
import { Presence } from '../Presence'
import { AccordionContext } from '../Accordion/accordion-context'

export interface CollapsibleProps {
  children?: React.ReactNode
  id?: string
  open?: boolean
  defaultOpen?: boolean
  onChange?: (open: boolean) => void
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
}

interface CollapsibleContextValue {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  disabled: boolean
  contentId: string
  setContentId: (id: string | null) => void
  accordionItem?: boolean
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(null)

let collapsibleIdCounter = 0

export function Collapsible({
  children,
  id,
  open: openProp,
  defaultOpen = false,
  onChange,
  onOpenChange,
  disabled = false,
}: CollapsibleProps) {
  const accordion = React.useContext(AccordionContext)
  const isAccordionItem = Boolean(accordion && id)

  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const isControlled = openProp !== undefined
  const isOpen = isAccordionItem
    ? accordion!.isItemOpen(id!)
    : isControlled
      ? openProp
      : internalOpen

  const generatedContentIdRef = React.useRef<string | null>(null)
  if (!generatedContentIdRef.current) {
    generatedContentIdRef.current = `collapsible-content-${++collapsibleIdCounter}`
  }

  const [explicitContentId, setExplicitContentId] = React.useState<string | null>(null)
  const contentId = explicitContentId ?? generatedContentIdRef.current

  const notify = onChange ?? onOpenChange

  const setIsOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (isAccordionItem) {
        accordion!.toggleItem(id!)
        return
      }
      if (!isControlled) {
        setInternalOpen(nextOpen)
      }
      notify?.(nextOpen)
    },
    [isAccordionItem, accordion, id, isControlled, notify]
  )

  const isDisabled = disabled || (isAccordionItem ? accordion!.disabled : false)

  const contextValue = React.useMemo<CollapsibleContextValue>(
    () => ({
      isOpen,
      setIsOpen,
      disabled: isDisabled,
      contentId,
      setContentId: setExplicitContentId,
      accordionItem: isAccordionItem,
    }),
    [isOpen, setIsOpen, isDisabled, contentId, isAccordionItem]
  )

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
      data-reference-accordion-item={context?.accordionItem ? '' : undefined}
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
      return () => setContentId(null)
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
