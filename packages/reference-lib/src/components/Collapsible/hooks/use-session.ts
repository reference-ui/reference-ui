/**
 * Disclosure session: every ref and mirror behind the Collapsible context.
 * Openness resolves through the Accordion item policy first, then controlled
 * state, then the internal store; the hook also owns the content linkage
 * ids, the presence mirrors the panel writes back, the motion-skip and
 * trigger refs, and the dual-notify setter the trigger calls.
 */
import * as React from 'react'
import { AccordionContext } from '../../Accordion/context'
import type { CollapsibleContextValue } from '../context'

export interface SessionOptions {
  id: string | undefined
  openProp: boolean | undefined
  defaultOpen: boolean
  onChange?: (open: boolean) => void
  onOpenChange?: (open: boolean) => void
  disabled: boolean
  hiddenUntilFound: boolean
}

export function useSession({
  id,
  openProp,
  defaultOpen,
  onChange,
  onOpenChange,
  disabled,
  hiddenUntilFound,
}: SessionOptions): CollapsibleContextValue {
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

  return contextValue
}
