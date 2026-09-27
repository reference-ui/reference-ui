import * as React from 'react'
import {
  Div,
  type PrimitiveProps,
  type PrimitiveElement,
  type PrimitiveTag,
} from '@reference-ui/react'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../Collapsible'
import { AccordionContext, type AccordionContextValue } from './accordion-context'

type ReferencePartProps<Tag extends PrimitiveTag> =
  PrimitiveProps<Tag> & React.RefAttributes<PrimitiveElement<Tag>>

export type AccordionExpansion = 'single' | 'multiple'
export type AccordionKeyboard = 'headers' | 'none' | 'arrows'
export type AccordionValue = string | string[] | null

export interface AccordionProps
  extends Omit<ReferencePartProps<'div'>, 'onChange' | 'value'> {
  children?: React.ReactNode
  expansion?: AccordionExpansion
  /** Optional value. Single uses string|null, multiple uses string[]. Omitted = self-managed from the natural zero state (null single, [] multiple). */
  value?: AccordionValue
  /** Optional notification, emitted in both controlled and self-managed modes. */
  onChange?: (value: AccordionValue) => void
  disabled?: boolean
  /** 'arrows' is accepted as an alias of 'headers' (base-API compatibility). */
  keyboard?: AccordionKeyboard
}

export type AccordionItemProps = {
  id: string
  children?: React.ReactNode
  disabled?: boolean
}

export function AccordionItem({ id, children, disabled = false }: AccordionItemProps) {
  return (
    <Collapsible id={id} disabled={disabled}>
      {children}
    </Collapsible>
  )
}

function composeRefs<T>(...refs: (React.Ref<T> | undefined | null)[]) {
  return (node: T | null) => {
    const cleanups: (() => void)[] = []
    for (const ref of refs) {
      if (typeof ref === 'function') {
        const cleanup = ref(node)
        if (typeof cleanup === 'function') {
          cleanups.push(cleanup)
        }
      } else if (ref && typeof ref === 'object' && 'current' in ref) {
        ;(ref as React.MutableRefObject<T | null>).current = node
      }
    }
    if (cleanups.length > 0) {
      return () => {
        for (const cleanup of cleanups) {
          cleanup()
        }
      }
    }
  }
}

function isCollapsibleElement(element: React.ReactElement): boolean {
  const props = element.props as Record<string, unknown> | null | undefined
  return Boolean(
    element.type === Collapsible ||
    element.type === AccordionItem ||
    (element.type as any) === Accordion?.Item ||
    (typeof element.type !== 'string' &&
      props &&
      typeof props === 'object' &&
      ('id' in props || 'open' in props || 'disabled' in props))
  )
}

function validateAndCollectItemIds(children: React.ReactNode, isDev: boolean): string[] {
  const ids: string[] = []
  const seenIds = new Set<string>()

  const traverse = (nodes: React.ReactNode) => {
    React.Children.forEach(nodes, (child) => {
      if (!React.isValidElement(child)) return

      if (child.type === React.Fragment) {
        traverse((child.props as any)?.children)
        return
      }

      if (isCollapsibleElement(child)) {
        const props = child.props as Record<string, any>
        if (isDev) {
          // AC-DOM-05: Missing, empty, or duplicate item identities
          if (props.id === undefined) {
            const err = '[Reference UI Accordion] Item Collapsible is missing required "id" prop.'
            console.error(err)
            throw new Error(err)
          }
          if (props.id === '') {
            const err = '[Reference UI Accordion] Item Collapsible has an empty "id" prop.'
            console.error(err)
            throw new Error(err)
          }
          if (seenIds.has(props.id)) {
            const err = `[Reference UI Accordion] Duplicate item id "${props.id}". Each Accordion item must have a unique id.`
            console.error(err)
            throw new Error(err)
          }
          seenIds.add(props.id)

          // AC-DOM-08: Competing controlled props
          if (props.open !== undefined || props.onChange !== undefined) {
            console.error(
              '[Reference UI Accordion] Competing authority: Child Collapsible specifies "open" or "onChange" props while nested inside an Accordion. The root Accordion is the sole expansion authority.'
            )
          }
        }
        if (typeof props.id === 'string' && props.id !== '') {
          ids.push(props.id)
        }
      }
    })
  }

  traverse(children)
  return ids
}

function wrapChildren(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child
    if (child.type === React.Fragment) {
      return React.cloneElement(child, {
        children: wrapChildren((child.props as any).children),
      } as any)
    }
    if (isCollapsibleElement(child)) {
      // AC-NEST-02: Wrap child's children in <AccordionContext.Provider value={null}>
      // so any standalone Collapsible inside Content is NOT captured by this Accordion
      const childChildren = (child.props as any).children
      return React.cloneElement(
        child,
        undefined,
        <AccordionContext.Provider value={null}>
          {childChildren}
        </AccordionContext.Provider>
      )
    }
    return child
  })
}

function findNextEnabledIndex(
  allTriggers: HTMLButtonElement[],
  currentIndex: number,
  direction: 1 | -1
): number {
  const count = allTriggers.length
  if (count === 0) return -1
  for (let i = 1; i <= count; i++) {
    const nextIndex = (currentIndex + direction * i + count * 10) % count
    const candidate = allTriggers[nextIndex]
    if (candidate && !candidate.disabled && !candidate.hasAttribute('disabled')) {
      return nextIndex
    }
  }
  return -1
}

function isInsideContentOf(activeEl: HTMLElement, rootEl: HTMLElement): boolean {
  let cur: HTMLElement | null = activeEl.parentElement
  while (cur && cur !== rootEl) {
    if (cur.hasAttribute('data-reference-accordion')) {
      return false
    }
    if (cur.tagName === 'DIV' && cur.hasAttribute('data-state') && cur.hasAttribute('id')) {
      return true
    }
    cur = cur.parentElement
  }
  return false
}

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
      if (expansion === 'single') {
        if (valueProp !== undefined && valueProp !== null && typeof valueProp !== 'string') {
          const err = `[Reference UI Accordion] Incompatible mode/value pair: expansion="single" requires a string or null value, received ${typeof valueProp}.`
          console.error(err)
          throw new Error(err)
        }
      } else if (expansion === 'multiple') {
        if (valueProp !== undefined && !Array.isArray(valueProp)) {
          const err = `[Reference UI Accordion] Incompatible mode/value pair: expansion="multiple" requires an array value, received ${typeof valueProp}.`
          console.error(err)
          throw new Error(err)
        }
      }
    }

    // Authored item identities and dev diagnostics
    const authoredItemIds = validateAndCollectItemIds(children, isDev)
    const renderItemIdsRef = React.useRef<string[]>([])
    renderItemIdsRef.current = []

    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const composedRef = React.useMemo(() => composeRefs(rootRef, forwardedRef), [forwardedRef])

    // Self-managed store: omitted value expands via internal state from the natural zero.
    const isControlled = valueProp !== undefined
    const [internalValue, setInternalValue] = React.useState<AccordionValue>(() =>
      expansion === 'single' ? null : []
    )
    const currentValue = isControlled ? valueProp : internalValue

    const isItemOpen = React.useCallback(
      (id: string) => {
        if (!renderItemIdsRef.current.includes(id)) {
          renderItemIdsRef.current.push(id)
        }
        if (expansion === 'single') {
          return currentValue === id
        } else {
          const current = Array.isArray(currentValue) ? currentValue : []
          return current.includes(id)
        }
      },
      [expansion, currentValue]
    )

    const toggleItem = React.useCallback(
      (id: string) => {
        let nextValue: AccordionValue
        if (expansion === 'single') {
          nextValue = currentValue === id ? null : id
        } else {
          const currentList = Array.isArray(currentValue) ? currentValue : []
          const currentSet = new Set(currentList)

          if (currentSet.has(id)) {
            currentSet.delete(id)
          } else {
            currentSet.add(id)
          }

          // AC-MULTI-04: Canonicalize order
          // 1. Known IDs in current DOM / authored order
          const knownIds = Array.from(new Set([...authoredItemIds, ...renderItemIdsRef.current]))
          const result: string[] = []

          for (const knownId of knownIds) {
            if (currentSet.has(knownId)) {
              result.push(knownId)
            }
          }

          // 2. Unknown IDs in incoming relative order (deduplicated)
          for (const rawId of currentList) {
            if (!knownIds.includes(rawId) && currentSet.has(rawId) && !result.includes(rawId)) {
              result.push(rawId)
            }
          }

          // 3. Any remaining IDs in currentSet
          for (const remainingId of currentSet) {
            if (!result.includes(remainingId)) {
              result.push(remainingId)
            }
          }

          nextValue = result
        }

        if (!isControlled) {
          setInternalValue(nextValue)
        }
        onChange?.(nextValue)
      },
      [expansion, currentValue, isControlled, onChange, authoredItemIds]
    )

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e)
      if (e.defaultPrevented || keyboard === 'none') return

      if (
        e.key !== 'ArrowDown' &&
        e.key !== 'ArrowUp' &&
        e.key !== 'Home' &&
        e.key !== 'End'
      ) {
        return
      }

      const rootEl = rootRef.current
      if (!rootEl) return

      const activeEl = document.activeElement as HTMLElement | null
      const targetEl = e.target as HTMLElement | null

      // AC-KEY-07: Ignore keys originating inside item Content of this Accordion
      const sourceEl = (activeEl && rootEl.contains(activeEl)) ? activeEl : targetEl
      if (sourceEl && isInsideContentOf(sourceEl, rootEl)) {
        return
      }

      const allTriggers = Array.from(
        rootEl.querySelectorAll<HTMLButtonElement>('button[aria-expanded]')
      ).filter((btn) => {
        if (btn.closest('[data-reference-accordion]') !== rootEl) return false
        if (isInsideContentOf(btn, rootEl)) return false
        return true
      })

      if (allTriggers.length === 0) return

      let activeIndex = -1
      if (activeEl && rootEl.contains(activeEl)) {
        activeIndex = allTriggers.findIndex(
          (btn) => btn === activeEl || btn.contains(activeEl)
        )
      }
      if (activeIndex === -1 && targetEl && rootEl.contains(targetEl)) {
        activeIndex = allTriggers.findIndex(
          (btn) => btn === targetEl || btn.contains(targetEl)
        )
      }
      if (activeIndex === -1) return

      let targetIndex = -1

      if (e.key === 'ArrowDown') {
        targetIndex = findNextEnabledIndex(allTriggers, activeIndex, 1)
      } else if (e.key === 'ArrowUp') {
        targetIndex = findNextEnabledIndex(allTriggers, activeIndex, -1)
      } else if (e.key === 'Home') {
        targetIndex = allTriggers.findIndex(
          (btn) => !btn.disabled && !btn.hasAttribute('disabled')
        )
      } else if (e.key === 'End') {
        for (let i = allTriggers.length - 1; i >= 0; i--) {
          const btn = allTriggers[i]
          if (btn && !btn.disabled && !btn.hasAttribute('disabled')) {
            targetIndex = i
            break
          }
        }
      }

      if (targetIndex !== -1 && allTriggers[targetIndex]) {
        e.preventDefault()
        allTriggers[targetIndex]?.focus()
      }
    }

    const contextValue = React.useMemo<AccordionContextValue>(
      () => ({
        expansion,
        isItemOpen,
        toggleItem,
        disabled,
      }),
      [expansion, isItemOpen, toggleItem, disabled]
    )

    const wrappedChildren = React.useMemo(() => wrapChildren(children), [children])

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
