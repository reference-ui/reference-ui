/**
 * Item detection: decides whether an authored child is an Accordion item. A
 * child counts when its type is one of the injected item identities (the raw
 * Collapsible, the Item part, the compound alias) or when it duck-types as a
 * disclosure (a non-host element carrying `id`, `open`, or `disabled`), so
 * wrapped and aliased items still join the collection.
 */
import type * as React from 'react'

export function isItemElement(
  element: React.ReactElement,
  itemTypes: readonly unknown[]
): boolean {
  const props = element.props as Record<string, unknown> | null | undefined
  return Boolean(
    itemTypes.some((itemType) => element.type === itemType) ||
    (typeof element.type !== 'string' &&
      props &&
      typeof props === 'object' &&
      ('id' in props || 'open' in props || 'disabled' in props))
  )
}
