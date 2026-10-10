/**
 * Thumb registry ordering: sortThumbIdsByDomOrder ranks mount ids by their
 * nodes' document position so thumb identity follows DOM order rather than
 * mount order, and countMismatchMessage phrases the fail-fast diagnostic
 * when the registered thumb count disagrees with the value length.
 */

export function countMismatchMessage(valueLength: number, thumbCount: number): string {
  return (
    `[Slider] Value-to-Thumb count mismatch: value has ${valueLength} ` +
    `${valueLength === 1 ? 'entry' : 'entries'} but ${thumbCount} ` +
    `${thumbCount === 1 ? 'Thumb is' : 'Thumbs are'} registered`
  )
}

// Mount ids in DOM order; disconnected or incomparable nodes keep
// registration order so identity never depends on layout availability.
export function sortThumbIdsByDomOrder(registry: Map<number, HTMLDivElement>): number[] {
  const entries = [...registry.entries()]
  try {
    entries.sort(([, a], [, b]) => {
      if (a === b) return 0
      const pos = a.compareDocumentPosition(b)
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1
      if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1
      return 0
    })
  } catch {
    // Conservatively keep registration order.
  }
  return entries.map(([id]) => id)
}
