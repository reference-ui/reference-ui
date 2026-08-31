import * as React from 'react'
import { Button, Div, Span, type PrimitiveProps } from '@reference-ui/react'
import { KeyboardArrowDownIcon } from '@reference-ui/icons'
import { Presence } from '../Presence'
import { AccordionContext } from '../Accordion/accordion-context'
import { animateCollapse } from '../../motion/collapse'
import { gsap, finiteGsapTweens } from '../../motion/gsap'

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
  skipEnterRef: React.MutableRefObject<boolean>
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(null)

let collapsibleIdCounter = 0

function assignRef<T>(ref: React.Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') {
    ref(value)
  } else if (ref && typeof ref === 'object' && 'current' in ref) {
    ;(ref as React.MutableRefObject<T | null>).current = value
  }
}

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
  const skipEnterRef = React.useRef(isOpen)

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
      skipEnterRef,
    }),
    [isOpen, setIsOpen, isDisabled, contentId, isAccordionItem]
  )

  return (
    <CollapsibleContext.Provider value={contextValue}>
      {children}
    </CollapsibleContext.Provider>
  )
}

export type CollapsibleTriggerProps = PrimitiveProps<'button'> & {
  hideIcon?: boolean
  icon?: React.ReactNode
}

export function CollapsibleTrigger({
  children,
  onClick,
  disabled: disabledProp,
  type = 'button',
  hideIcon = false,
  icon,
  style,
  borderBottomWidth,
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

  const triggerStyle: React.CSSProperties | undefined = React.useMemo(() => {
    if (!isOpen || !style) return style
    return {
      ...style,
      borderBottomWidth: 0,
      borderBottomStyle: 'none' as const,
    }
  }, [isOpen, style])

  const renderIcon = () => {
    if (hideIcon) return null
    return (
      <Span
        data-reference-disclosure-icon=""
        aria-hidden="true"
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        pointerEvents="none"
        ml="auto"
        flexShrink={0}
        color="design.text.light"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          marginLeft: 'auto',
          flexShrink: 0,
          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        }}
      >
        {icon ?? <KeyboardArrowDownIcon width="1.25em" height="1.25em" />}
      </Span>
    )
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
      borderBottomWidth={isOpen && borderBottomWidth !== undefined ? '0px' : borderBottomWidth}
      style={triggerStyle}
      {...props}
    >
      {children}
      {renderIcon()}
    </Button>
  )
}

export type CollapsibleContentProps = PrimitiveProps<'div'>

type CollapsibleContentPanelProps = CollapsibleContentProps & {
  isOpen: boolean
  disabled: boolean
  consumerRef?: React.Ref<HTMLDivElement>
  skipEnterRef: React.MutableRefObject<boolean>
}

const CollapsibleContentPanel = React.forwardRef<HTMLDivElement, CollapsibleContentPanelProps>(
  function CollapsibleContentPanel(
    { isOpen, disabled, consumerRef, skipEnterRef, children, style, ...props },
    presenceRef
  ) {
    const nodeRef = React.useRef<HTMLDivElement | null>(null)

    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        nodeRef.current = node
        assignRef(presenceRef, node)
        assignRef(consumerRef, node)
      },
      [presenceRef, consumerRef]
    )

    const publish = React.useCallback(() => {
      const node = nodeRef.current
      if (!node) return
      const rect = node.getBoundingClientRect()
      if (rect.height > 0) {
        node.style.setProperty('--reference-collapsible-content-height', `${rect.height}px`)
      }
      if (rect.width > 0) {
        node.style.setProperty('--reference-collapsible-content-width', `${rect.width}px`)
      }
    }, [])

    React.useLayoutEffect(() => {
      const node = nodeRef.current
      if (!node || !isOpen) return

      if (typeof ResizeObserver === 'undefined') return

      const observer = new ResizeObserver(() => {
        // Skip layout recalculation during active animation frames to avoid stutter
        if (finiteGsapTweens(node).length > 0) return
        publish()
      })
      observer.observe(node)
      return () => observer.disconnect()
    }, [isOpen, publish])

    React.useLayoutEffect(() => {
      const node = nodeRef.current
      if (!node) return

      const skip = Boolean(skipEnterRef.current && isOpen)
      if (isOpen) skipEnterRef.current = false
      animateCollapse(node, {
        open: isOpen,
        skip,
        onComplete: () => {
          if (isOpen) publish()
        },
      })

      return () => {
        gsap.killTweensOf(node)
      }
    }, [isOpen, skipEnterRef, publish])

    return (
      <Div
        ref={setRefs}
        {...props}
        data-state={isOpen ? 'open' : 'closed'}
        data-disabled={disabled ? '' : undefined}
        style={style}
      >
        {children}
      </Div>
    )
  }
)

export const CollapsibleContent = React.forwardRef<HTMLDivElement, CollapsibleContentProps>(
  function CollapsibleContent({ children, id: idProp, style, ...props }, forwardedRef) {
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
        <CollapsibleContentPanel
          id={contentId}
          isOpen={context.isOpen}
          disabled={context.disabled}
          consumerRef={forwardedRef}
          skipEnterRef={context.skipEnterRef}
          style={style}
          {...props}
        >
          {children}
        </CollapsibleContentPanel>
      </Presence>
    )
  }
)

Collapsible.Trigger = CollapsibleTrigger
Collapsible.Content = CollapsibleContent
