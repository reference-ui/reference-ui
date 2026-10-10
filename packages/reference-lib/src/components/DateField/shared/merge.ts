/**
 * Prop merging for the Part-Resolution Law: mergeClassNames joins the
 * defined class legs, mergeStyles layers the defined style legs. Both
 * field machines compose root, explicit, and managed props through
 * these so decoration merges while managed state wins.
 */
import type * as React from 'react'

export function mergeClassNames(
  ...classes: Array<string | undefined | null | false>
): string | undefined {
  const merged = classes.filter(Boolean).join(' ')
  return merged ? merged : undefined
}

export function mergeStyles(
  ...styles: Array<React.CSSProperties | undefined>
): React.CSSProperties | undefined {
  const merged: React.CSSProperties = {}
  for (const s of styles) {
    if (s) Object.assign(merged, s)
  }
  return Object.keys(merged).length > 0 ? merged : undefined
}
