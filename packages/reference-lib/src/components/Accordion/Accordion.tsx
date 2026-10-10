/**
 * Accordion root: collection policy over Collapsible items. The component
 * validates the value shape, collects authored identities, composes the
 * expansion store with the header traversal handler, and renders the context
 * provider over a single div — item disclosures stay Collapsibles, and the
 * compound aliases re-export the shared parts.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../Collapsible'
import { AccordionContext, type AccordionContextValue } from './context'
import type { AccordionProps } from './types'
import { AccordionItem } from './parts/Item'
import { collectItemIds } from './items/collect'
import { scopeItemChildren } from './items/scope'
import { assertValueShape } from './expansion/policy'
import { useAccordionValue } from './hooks/use-accordion-value'
import { useHeaderKeyboard } from './hooks/use-header-keyboard'
import { composeRefs } from './shared/refs'

export type {
  AccordionExpansion,
  AccordionKeyboard,
  AccordionValue,
  AccordionProps,
  AccordionItemProps,
} from './types'
export { AccordionItem } from './parts/Item'

export const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  function Accordion(
    {
      children,
      expansion = 'single',
      value: valueProp,
      onChange,
      disabled = false,
      keyboard = 'headers',
      onKeyDown,
      ...props
    },
    forwardedRef
  ) {
    const isDev = process.env.NODE_ENV !== 'production'

    // AC-MULTI-06: Value shape vs expansion mode validation in dev
    if (isDev) {
      assertValueShape(expansion, valueProp)
    }

    // Item identities for collection and scoping: the raw Collapsible, the
    // Item part, and the compound alias (which resolves to the same part).
    const itemTypes: readonly unknown[] = [
      Collapsible,
      AccordionItem,
      (Accordion as unknown as { Item?: unknown })?.Item,
    ]

    // Authored item identities and dev diagnostics
    const authoredItemIds = collectItemIds(children, { itemTypes, dev: isDev })

    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const composedRef = React.useMemo(() => composeRefs(rootRef, forwardedRef), [forwardedRef])

    const { isItemOpen, toggleItem } = useAccordionValue({
      expansion,
      valueProp,
      onChange,
      authoredItemIds,
    })
    const handleKeyDown = useHeaderKeyboard({ rootRef, keyboard, onKeyDown })

    const contextValue = React.useMemo<AccordionContextValue>(
      () => ({
        expansion,
        isItemOpen,
        toggleItem,
        disabled,
      }),
      [expansion, isItemOpen, toggleItem, disabled]
    )

    const wrappedChildren = React.useMemo(() => scopeItemChildren(children, itemTypes), [children])

    return (
      <AccordionContext.Provider value={contextValue}>
        <Div
          ref={composedRef}
          data-reference-accordion=""
          onKeyDown={handleKeyDown}
          {...props}
        >
          {wrappedChildren}
        </Div>
      </AccordionContext.Provider>
    )
  }
) as React.ForwardRefExoticComponent<AccordionProps & React.RefAttributes<HTMLDivElement>> & {
  Item: typeof AccordionItem
  Trigger: typeof CollapsibleTrigger
  Content: typeof CollapsibleContent
}

Accordion.Item = AccordionItem
Accordion.Trigger = CollapsibleTrigger
Accordion.Content = CollapsibleContent
