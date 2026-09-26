/**
 * Inline-completion decision (#1, CB-MODE-03/04/07). Pure so unit tests pin
 * the matrix without a browser; ComboboxInput applies the result to the DOM
 * (value + suffix-only selection) without emitting text callbacks.
 */

/**
 * Returns the label to display when it completes the typed prefix, else
 * null. Matching is case-insensitive (standard inline-autocomplete
 * behavior; TESTS pins the exact-case prefix). Empty prefixes and
 * exact-length matches complete to nothing — with no user text there is
 * nothing to complete, and with no suffix there is nothing to select.
 */
export function completionForPrefix(
  prefix: string,
  label: string | null | undefined
): string | null {
  if (label == null || label.length === 0) return null
  if (prefix.length === 0) return null
  if (label.length <= prefix.length) return null
  if (!label.toLowerCase().startsWith(prefix.toLowerCase())) return null
  return label
}


