/**
 * Single/multiple expansion policy: the pure value math behind the Accordion
 * context. isItemOpenInValue reads one id's openness, nextSingleValue and
 * nextMultipleValue compute the toggled value (multiple canonicalizes id
 * order per AC-MULTI-04), and assertValueShape throws the dev-mode
 * mode/value mismatch errors the root surfaces.
 */
import type { AccordionExpansion, AccordionValue } from '../types'

export function isItemOpenInValue(
  expansion: AccordionExpansion,
  currentValue: AccordionValue,
  id: string
): boolean {
  if (expansion === 'single') {
    return currentValue === id
  }
  const current = Array.isArray(currentValue) ? currentValue : []
  return current.includes(id)
}

export function nextSingleValue(currentValue: AccordionValue, id: string): AccordionValue {
  return currentValue === id ? null : id
}

export function nextMultipleValue(
  currentValue: AccordionValue,
  id: string,
  knownIds: readonly string[]
): string[] {
  const currentList = Array.isArray(currentValue) ? currentValue : []
  const currentSet = new Set(currentList)

  if (currentSet.has(id)) {
    currentSet.delete(id)
  } else {
    currentSet.add(id)
  }

  // AC-MULTI-04: Canonicalize order
  // 1. Known IDs in current DOM / authored order
  const known = Array.from(new Set(knownIds))
  const result: string[] = []

  for (const knownId of known) {
    if (currentSet.has(knownId)) {
      result.push(knownId)
    }
  }

  // 2. Unknown IDs in incoming relative order (deduplicated)
  for (const rawId of currentList) {
    if (!known.includes(rawId) && currentSet.has(rawId) && !result.includes(rawId)) {
      result.push(rawId)
    }
  }

  // 3. Any remaining IDs in currentSet
  for (const remainingId of currentSet) {
    if (!result.includes(remainingId)) {
      result.push(remainingId)
    }
  }

  return result
}

/** AC-MULTI-06: Value shape vs expansion mode validation in dev. */
export function assertValueShape(expansion: AccordionExpansion, valueProp: AccordionValue | undefined): void {
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
