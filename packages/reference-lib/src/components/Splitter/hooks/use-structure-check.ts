/**
 * useStructureCheck: strict structural errors that throw fail-fast
 * (FEATURES #9). Validation runs in a layout effect — after the children's
 * registration effects, so an atomic insert/remove/reorder commit validates
 * in its final shape — and the hook returns the recorded error for the
 * root to throw during the next render, before paint, with no separator
 * ARIA, capture, or listeners left behind. A bad panel layout also
 * dev-warns with the same diagnostic, so the failure is loud twice over
 * and never a silent 13px collapse.
 */
import * as React from 'react'
import { validateSplitterStructure, type SplitterStructurePart } from '../math/splitter-math'
import type { RegisteredHandle, RegisteredPanel } from '../context'
import { isProductionEnv, warnSplitter } from '../shared/warn'
import { useIsomorphicLayoutEffect } from '../shared/refs'

export function useStructureCheck(
  value: number[],
  panelsRef: React.MutableRefObject<RegisteredPanel[]>,
  handlesRef: React.MutableRefObject<RegisteredHandle[]>
): string | null {
  // FEATURES #9: strict structural errors throw fail-fast. Validation runs
  // in a layout effect — after the children's registration effects, so an
  // atomic insert/remove/reorder commit validates in its final shape —
  // and the recorded error throws during the next render, before paint,
  // with no separator ARIA, capture, or listeners left behind. Terminal
  // for that mount: recovery is an error boundary plus a tree fix.
  const [structureError, setStructureError] = React.useState<string | null>(null)
  useIsomorphicLayoutEffect(() => {
    const merged: Array<{ kind: SplitterStructurePart; element: HTMLDivElement | null }> = [
      ...panelsRef.current.map((panel) => ({
        kind: 'panel' as const,
        element: panel.element,
      })),
      ...handlesRef.current.map((handle) => ({
        kind: 'handle' as const,
        element: handle.element,
      })),
    ]
    merged.sort((a, b) => {
      if (!a.element || !b.element) return 0
      const pos = a.element.compareDocumentPosition(b.element)
      return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
    })
    const check = validateSplitterStructure(
      merged.map((part) => part.kind),
      value.length
    )
    const next = check.valid ? null : (check.error ?? 'Invalid Splitter structure.')
    // Clamp-or-warn: a bad panel layout (e.g. value=[10,10,80] on 2
    // panels — the silent-collapse case) dev-warns with the same
    // diagnostic the throw carries, so the failure is loud twice over and
    // never a silent 13px collapse. The throw below stays.
    if (!check.valid && next && !isProductionEnv()) {
      warnSplitter(next)
    }
    setStructureError((prev) => (prev === next ? prev : next))
  })
  return structureError
}
