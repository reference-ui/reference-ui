/**
 * Combobox's id hygiene: React useIds and logical values carry characters
 * (colons, spaces) that break querySelector and ARIA wiring, so every
 * derived id funnels through sanitizeIdSegment. The root prefixes its
 * popover id; VirtualItem derives stable value-based cell ids. Pure —
 * one regex, shared by both call sites so the shape cannot drift.
 */

export function sanitizeIdSegment(rawId: string): string {
  return rawId.replace(/[^a-zA-Z0-9_-]/g, '')
}

export function sanitizeComboboxId(rawId: string) {
  return `ref-cb-pop-${sanitizeIdSegment(rawId)}`
}
