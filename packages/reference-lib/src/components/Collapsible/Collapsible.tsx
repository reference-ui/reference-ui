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
  /**
   * CO-MOUNT: default `hidden` passthrough for Content. Closed content stays
   * mounted but hidden (`hidden="until-found"`), so browser find can reveal
   * it. A Content-level `hiddenUntilFound` prop wins over this default.
   */
  hiddenUntilFound?: boolean
}

interface CollapsibleContextValue {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  disabled: boolean
  contentId: string
  setContentId: (id: string | null) => void
  accordionItem?: boolean
  skipEnterRef: React.MutableRefObject<boolean>
  /** Armed by beforematch; consumed by the next open (skips enter motion once). */
  skipMotionOnceRef: React.MutableRefObject<boolean>
  /** Root-level default for Content `hiddenUntilFound` (Content prop wins). */
  hiddenUntilFound: boolean
  isContentPresent: boolean
  setIsContentPresent: (present: boolean) => void
  isContentMounted: boolean
  setIsContentMounted: React.Dispatch<React.SetStateAction<boolean>>
  triggerRef: React.MutableRefObject<HTMLButtonElement | null>
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(null)

function setRef<T>(ref: React.Ref<T> | undefined, value: T | null): (() => void) | void {
  if (typeof ref === 'function') {
    return ref(value)
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
  hiddenUntilFound = false,
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

  const [isContentPresent, setIsContentPresent] = React.useState(isOpen)
  const [isContentMounted, setIsContentMounted] = React.useState(false)

  // Cache the first generated id: the React 17 CT shim mints a fresh useId
  // per render, and linkage must stay stable across renders on every runtime.
  const reactId = React.useId()
  const generatedContentIdRef = React.useRef<string | null>(null)
  if (!generatedContentIdRef.current) {
    generatedContentIdRef.current = `collapsible-content-${reactId.replace(/:/g, '')}`
  }
  const generatedContentId = generatedContentIdRef.current

  const [explicitContentId, setExplicitContentId] = React.useState<string | null>(null)
  const contentId = explicitContentId ?? generatedContentId
  const skipEnterRef = React.useRef(isOpen)
  const skipMotionOnceRef = React.useRef(false)
  const triggerRef = React.useRef<HTMLButtonElement | null>(null)

  // B-12: both change handlers fire, non-breaking — either alone behaves
  // exactly as before (onChange first, preserving the old ?? winner order).
  const notify = React.useCallback(
    (nextOpen: boolean) => {
      onChange?.(nextOpen)
      onOpenChange?.(nextOpen)
    },
    [onChange, onOpenChange]
  )

  const setIsOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (isAccordionItem) {
        accordion!.toggleItem(id!)
        return
      }
      if (!isControlled) {
        setInternalOpen(nextOpen)
      }
      notify(nextOpen)
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
      skipMotionOnceRef,
      hiddenUntilFound,
      isContentPresent,
      setIsContentPresent,
      isContentMounted,
      setIsContentMounted,
      triggerRef,
    }),
    [isOpen, setIsOpen, isDisabled, contentId, isAccordionItem, isContentPresent, isContentMounted, hiddenUntilFound]
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

export const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(
  function CollapsibleTrigger(
    {
      children,
      onClick,
      disabled: disabledProp,
      type = 'button',
      hideIcon = false,
      icon,
      style,
      borderBottomWidth,
      ...props
    },
    forwardedRef
  ) {
    const context = React.useContext(CollapsibleContext)
    const isDisabled = disabledProp ?? context?.disabled ?? false
    const isOpen = context?.isOpen ?? false
    const isContentPresent = context?.isContentPresent ?? isOpen
    const isContentMounted = context?.isContentMounted ?? false
    const hideBottomBorder = isOpen || isContentPresent

    // CO-DOM-02 & CO-DOM-03: link open trigger to mounted content, keep during exit, remove after unmount
    // CO-DOM-09: no dangling aria-controls if Content is absent
    const hasTarget = isContentMounted && (isOpen || isContentPresent)
    const ariaControls = hasTarget ? context?.contentId : undefined

    const setRefs = React.useCallback(
      (node: HTMLButtonElement | null) => {
        if (context) {
          context.triggerRef.current = node
        }
        return setRef(forwardedRef, node)
      },
      [forwardedRef, context]
    )

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e)
      // CO-ACT-08: Collapsible owns only native primary button activation
      if (e.button !== 0) return
      if (!e.defaultPrevented && !isDisabled && context) {
        context.setIsOpen(!context.isOpen)
      }
    }

    const triggerStyle: React.CSSProperties | undefined = React.useMemo(() => {
      if (!hideBottomBorder || !style) return style
      return {
        ...style,
        borderBottomWidth: 0,
        borderBottomStyle: 'none' as const,
      }
    }, [hideBottomBorder, style])

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
        {...props}
        ref={setRefs}
        aria-expanded={isOpen}
        aria-controls={ariaControls}
        data-state={isOpen ? 'open' : 'closed'}
        data-disabled={isDisabled ? '' : undefined}
        data-content-present={isContentPresent ? '' : undefined}
        data-reference-accordion-item={context?.accordionItem ? '' : undefined}
        disabled={isDisabled}
        onClick={handleClick}
        borderBottomWidth={hideBottomBorder && borderBottomWidth !== undefined ? '0px' : borderBottomWidth}
        style={triggerStyle}
      >
        {children}
        {renderIcon()}
      </Button>
    )
    }
)


export type CollapsibleContentProps = PrimitiveProps<'div'> & {
  /**
   * CO-MOUNT: keep closed content mounted but hidden (`hidden="until-found"`)
   * so browser find can reveal it. Wins over `forceMount` (hidden content
   * must actually hide) and over the root default. Closed content still
   * animates shut instantly and stays inert; a `beforematch` reveal opens
   * the Collapsible with enter motion skipped.
   */
  hiddenUntilFound?: boolean
  /**
   * CO-MOUNT: keep closed content mounted AND interactive (no `hidden`, no
   * inert, no collapse styles) — the escape hatch for measured/pre-mounted
   * content. Focus is never evacuated on close. Loses to `hiddenUntilFound`.
   */
  forceMount?: boolean
}

type CollapsibleContentPanelProps = Omit<CollapsibleContentProps, 'hiddenUntilFound' | 'forceMount'> & {
  isOpen: boolean
  disabled: boolean
  consumerRef?: React.Ref<HTMLDivElement>
  skipEnterRef: React.MutableRefObject<boolean>
  skipMotionOnceRef: React.MutableRefObject<boolean>
  untilFound: boolean
  forceMountAlone: boolean
  inert?: boolean
  'aria-hidden'?: boolean | 'true' | 'false'
}

const CollapsibleContentPanel = React.forwardRef<HTMLDivElement, CollapsibleContentPanelProps>(
  function CollapsibleContentPanel(
    {
      isOpen,
      disabled,
      consumerRef,
      skipEnterRef,
      skipMotionOnceRef,
      untilFound,
      forceMountAlone,
      children,
      style,
      inert: userInert,
      'aria-hidden': userAriaHidden,
      ...props
    },
    presenceRef
  ) {
    const nodeRef = React.useRef<HTMLDivElement | null>(null)

    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        nodeRef.current = node
        setRef(presenceRef, node)
        setRef(consumerRef, node)
      },
      [presenceRef, consumerRef]
    )

    const context = React.useContext(CollapsibleContext)
    const setIsContentPresent = context?.setIsContentPresent

    React.useEffect(() => {
      setIsContentPresent?.(true)
      return () => {
        setIsContentPresent?.(false)
      }
    }, [setIsContentPresent])

    // CO-PRES-07: Evacuate focus before closing Content becomes inert.
    // CO-MOUNT: forceMount-alone content stays interactive when closed, so
    // focus inside it is never evacuated.
    const prevOpenRef = React.useRef(isOpen)
    React.useLayoutEffect(() => {
      const wasOpen = prevOpenRef.current
      prevOpenRef.current = isOpen

      if (wasOpen && !isOpen && !forceMountAlone) {
        const node = nodeRef.current
        if (node && typeof document !== 'undefined') {
          const activeEl = document.activeElement
          if (activeEl && node.contains(activeEl)) {
            const trigger = context?.triggerRef.current
            if (trigger && trigger.isConnected && !trigger.disabled) {
              trigger.focus()
            } else {
              if (activeEl instanceof HTMLElement) {
                activeEl.blur()
              }
              if (document.body && typeof document.body.focus === 'function') {
                document.body.focus()
              }
            }
          }
        }
      }
    }, [isOpen, context, forceMountAlone])

    // CO-MOUNT: browser find (`beforematch`) on closed hidden-until-found
    // content opens the Collapsible and skips enter motion so the match is
    // visible immediately. A consumer-cancelled reveal stays closed.
    React.useEffect(() => {
      if (!untilFound) return
      const node = nodeRef.current
      if (!node) return
      const handleBeforeMatch = (event: Event) => {
        // Defer past dispatch: every sync listener (including a consumer
        // canceler registered after mount) runs before the open decision.
        queueMicrotask(() => {
          if (event.defaultPrevented) return
          if (!node.isConnected) return
          if (isOpen) return
          skipMotionOnceRef.current = true
          context?.setIsOpen(true)
        })
      }
      node.addEventListener('beforematch', handleBeforeMatch)
      return () => {
        node.removeEventListener('beforematch', handleBeforeMatch)
      }
    }, [untilFound, isOpen, context, skipMotionOnceRef])

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

      const skipEnter = skipEnterRef.current && isOpen
      const skipOnce = skipMotionOnceRef.current && isOpen
      skipMotionOnceRef.current = false
      if (isOpen) skipEnterRef.current = false

      // CO-MOUNT: forceMount-alone content keeps author styles in both
      // states — no collapse tween and no instant restyle, open or closed.
      if (forceMountAlone) return

      // CO-MOUNT: hidden-until-found content shuts instantly (its boxes
      // are rendering-skipped either way); the open reveal tweens unless skipped.
      const skip = Boolean(skipEnter || skipOnce || (!isOpen && untilFound))
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
    }, [isOpen, skipEnterRef, skipMotionOnceRef, untilFound, forceMountAlone, publish])

    // CO-PRES-08: isolate visually exiting closed Content, restore only isolation it owns.
    // CO-MOUNT: forceMount-alone closed content stays interactive (no inert,
    // no aria-hidden, no pointer-events kill).
    const closedHidden = !isOpen && !forceMountAlone
    const isInert = closedHidden || Boolean(userInert)
    const isAriaHidden = closedHidden ? 'true' : userAriaHidden
    const contentStyle: React.CSSProperties = {
      ...style,
      ...(closedHidden ? { pointerEvents: 'none' } : undefined),
    }

    // CO-MOUNT: closed hidden-until-found content carries `hidden`, upgraded
    // to `until-found` before paint; React owns removal on open.
    const untilFoundClosed = untilFound && !isOpen
    React.useLayoutEffect(() => {
      const node = nodeRef.current
      if (!node) return
      if (untilFoundClosed) {
        node.setAttribute('hidden', 'until-found')
      }
    }, [untilFoundClosed])

    // `inert` is a known React attribute only from 19 (17/18 skip dash-less
    // unknown attributes), so toggle it imperatively for every runtime.
    React.useLayoutEffect(() => {
      const node = nodeRef.current
      if (!node) return
      if (isInert) {
        node.setAttribute('inert', '')
      } else {
        node.removeAttribute('inert')
      }
    }, [isInert])

    return (
      <Div
        ref={setRefs}
        {...props}
        hidden={untilFoundClosed ? true : undefined}
        data-state={isOpen ? 'open' : 'closed'}
        data-disabled={disabled ? '' : undefined}
        aria-hidden={isAriaHidden}
        style={contentStyle}
      >
        {children}
      </Div>
    )
  }
)

export const CollapsibleContent = React.forwardRef<HTMLDivElement, CollapsibleContentProps>(
  function CollapsibleContent(
    { children, id: idProp, style, hiddenUntilFound: hiddenUntilFoundProp, forceMount = false, ...props },
    forwardedRef
  ) {
    const context = React.useContext(CollapsibleContext)

    // CO-DOM-06: register linkage atomically with mount so trigger and content never disagree
    React.useLayoutEffect(() => {
      if (!context) return
      context.setContentId(idProp ?? null)
      context.setIsContentMounted(true)
      return () => {
        context.setContentId(null)
        context.setIsContentMounted(false)
      }
    }, [idProp, context])

    if (!context) return null

    const contentId = idProp ?? context.contentId

    // CO-MOUNT: Content prop wins over the root default; untilFound wins
    // over forceMount (hidden-until-found content must actually hide).
    const untilFound = hiddenUntilFoundProp ?? context.hiddenUntilFound ?? false
    const forceMountAlone = forceMount && !untilFound

    return (
      <Presence present={context.isOpen || untilFound || forceMount}>
        <CollapsibleContentPanel
          id={contentId}
          isOpen={context.isOpen}
          disabled={context.disabled}
          consumerRef={forwardedRef}
          skipEnterRef={context.skipEnterRef}
          skipMotionOnceRef={context.skipMotionOnceRef}
          untilFound={untilFound}
          forceMountAlone={forceMountAlone}
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
