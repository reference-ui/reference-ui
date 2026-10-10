/**
 * Nested-tooltip guard: a pointer event whose target sits inside a deeper
 * tooltip trigger belongs to that inner tooltip, so the outer one ignores
 * it instead of starting its own open timer. Compares the event target's
 * closest trigger marker against the current target the handler runs on.
 */
import type * as React from 'react'

export function isNestedTooltipTrigger(event: React.SyntheticEvent<HTMLElement>): boolean {
  const target = event.target
  if (!(target instanceof Element)) return false
  const nested = target.closest('[data-reference-tooltip-trigger]')
  return Boolean(nested && nested !== event.currentTarget)
}
