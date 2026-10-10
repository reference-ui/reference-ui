/**
 * Tracks whether the caller authored a thumb, seeded statically and repaired
 * structurally. The seed recognizes only the direct-authored shape so the
 * first paint (including SSR) is already correct; then, after every render,
 * the rendered DOM — the source of truth for Fragment-wrapped and
 * HOC-forwarded thumbs — reconciles the flag by counting thumb markers among
 * the root's children. Returns data only; the root decides what renders.
 */
import * as React from 'react'
import { hasDirectAuthoredThumb } from '../thumb/detect'
import { useIsomorphicLayoutEffect } from '../shared/effects'

interface AuthoredThumbOptions {
  children: React.ReactNode
  rootNodeRef: React.RefObject<HTMLButtonElement | null>
}

export function useAuthoredThumbPresence({ children, rootNodeRef }: AuthoredThumbOptions): boolean {
  const [authoredThumbPresent, setAuthoredThumbPresent] = React.useState(
    () => hasDirectAuthoredThumb(children)
  )

  useIsomorphicLayoutEffect(() => {
    const root = rootNodeRef.current
    if (!root) return
    let thumbs = 0
    for (const el of root.children) {
      if (el.hasAttribute('data-reference-switch-thumb')) thumbs++
    }
    if (authoredThumbPresent) {
      if (thumbs === 0) setAuthoredThumbPresent(false)
    } else if (thumbs > 1) {
      setAuthoredThumbPresent(true)
    }
  })

  return authoredThumbPresent
}
