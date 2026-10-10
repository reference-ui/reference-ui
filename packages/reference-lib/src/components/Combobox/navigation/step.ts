/**
 * Combobox's mounted-registry stepping: stepActiveValue wraps through
 * enabled logical options, tags the result keyboard-derived, and scrolls
 * it into view without moving DOM focus or the page; mountedValue keeps
 * only a still-mounted active option committable (CB-NAV-07), so dynamic
 * collections cannot commit a ghost. Shared by the Input and Trigger
 * keydown paths so arrow behavior cannot drift between focus sources.
 */
import type { ComboboxOptionEntry } from '../combobox-context'

export function stepActiveValue(args: {
  enabled: ComboboxOptionEntry[]
  current: string | null
  direction: 1 | -1
  setActive: (val: string, source: 'keyboard') => void
}) {
  const { enabled, current, direction, setActive } = args
  if (enabled.length === 0) return
  const currentIndex = enabled.findIndex(opt => opt.value === current)
  let nextIndex: number
  if (currentIndex === -1) {
    nextIndex = direction === 1 ? 0 : enabled.length - 1
  } else {
    nextIndex = (currentIndex + direction + enabled.length) % enabled.length
  }
  const next = enabled[nextIndex]
  if (next) {
    setActive(next.value, 'keyboard')
    next.node?.scrollIntoView({ block: 'nearest' })
  }
}

export function mountedValue(
  activeValue: string | null,
  enabled: ComboboxOptionEntry[]
): string | null {
  return activeValue != null && enabled.some(opt => opt.value === activeValue)
    ? activeValue
    : null
}
