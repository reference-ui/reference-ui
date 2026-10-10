/**
 * useCollapseMemory: restore sizes keyed by stable panel id, never array
 * position (FEATURES #6) — reorder keeps, remove isolates, reinsert must
 * recover. Every accepted expanded size overwrites, so Enter restores the
 * newest feasible expanded size. Entries survive unregister (recovery needs
 * them); ids are per-instance strings, so the map stays tiny.
 */
import * as React from 'react'
import { layoutNumbersEqual } from '../math/splitter-math'
import type { RegisteredPanel } from '../context'
import { sanitizeBoundNumber } from '../shared/geometry'
import { useIsomorphicLayoutEffect } from '../shared/refs'

export function useCollapseMemory(
  value: number[],
  panelsRef: React.MutableRefObject<RegisteredPanel[]>
): React.MutableRefObject<Map<string, number>> {
  // FEATURES #6: restore memory keyed by stable Panel id, never array
  // position — reorder keeps, remove isolates, reinsert must recover. Every
  // accepted expanded size overwrites, so Enter restores the newest
  // feasible expanded size. Entries survive unregister (recovery needs
  // them); ids are per-instance strings, so the map stays tiny.
  const rememberedSizesRef = React.useRef(new Map<string, number>())
  useIsomorphicLayoutEffect(() => {
    value.forEach((size, panelIndex) => {
      const panel = panelsRef.current[panelIndex]
      if (!panel?.collapsible) return
      // Entry-owned fields: they travel with the Panel id, so this read
      // stays correct even when render-time positional tables lag the
      // just-synced registry by one commit.
      const collapsedSize = sanitizeBoundNumber(panel.collapsedSize, 0)
      if (!layoutNumbersEqual(size, collapsedSize) && size > collapsedSize) {
        rememberedSizesRef.current.set(panel.id, size)
      }
    })
  })
  return rememberedSizesRef
}
