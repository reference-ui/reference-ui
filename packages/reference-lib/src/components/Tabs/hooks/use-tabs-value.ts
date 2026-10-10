/**
 * Tabs' value state: optional controlled value with an uncontrolled
 * natural-zero seed. Takes the value prop, onChange, and registry
 * readers; returns the resolved value, the controlled flag, and the
 * redundant-suppressed setter. Seeding is a mount repair (no onChange);
 * an unmatched controlled value warns in dev with the registered names.
 */
import * as React from 'react'
import type { TabsTabEntry } from '../context'
import { warnTabs } from '../shared/warn'

export function useTabsValue({ valueProp, onChange, getOrderedEnabledTabs, registryVersion, tabEntries }: {
  valueProp: string | undefined
  onChange: ((value: string) => void) | undefined
  getOrderedEnabledTabs: () => string[]
  registryVersion: number
  tabEntries: React.RefObject<Map<string, TabsTabEntry>>
}) {
const isControlled = valueProp !== undefined
  const [internalValue, setInternalValue] = React.useState<string | null>(null)
  const value = isControlled ? valueProp : (internalValue ?? '')

// Natural-zero seed (optional value): an uncontrolled Tabs with no
  // user selection yet starts on the first enabled tab. Seeding is a
  // mount repair, not a transition — no onChange fires. Retries across
  // registry bumps until a seed sticks; user selections (non-null
  // internalValue) are never reseeded.
  React.useEffect(() => {
    if (isControlled || internalValue !== null) return
    const first = getOrderedEnabledTabs()[0]
    if (first !== undefined) setInternalValue(first)
  }, [isControlled, internalValue, registryVersion, getOrderedEnabledTabs])

// Unmatched controlled value (W-16, near-verbatim MUI precedent): a
  // typo'd controlled value renders a silently blank panel, so dev names
  // the component, the bad value, and the registered values. Uncontrolled
  // mode never warns (seed and transitions always come from registered
  // tabs), and neither does an empty registry — async tabs that resolve
  // must never false-positive on first render.
  React.useEffect(() => {
    if (!isControlled) return
    const registered = Array.from(tabEntries.current.keys())
    if (registered.length === 0) return
    if (!registered.includes(value)) {
      warnTabs(
        `value "${value}" matches no Tab (registered values: ${registered.join(', ')}).`
      )
    }
  }, [isControlled, value, registryVersion])

const setValue = React.useCallback(
    (nextValue: string) => {
      // Redundant requests are suppressed (TB-SELECT-04, TB-MANUAL-04):
      // activating the selected tab is a no-op, not a transition.
      if (nextValue === value) return
      if (!isControlled) {
        setInternalValue(nextValue)
      }
      onChange?.(nextValue)
    },
    [isControlled, onChange, value]
  )
  return { value, isControlled, setValue }
}
