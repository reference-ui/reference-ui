/**
 * Tree's unmatched-id diagnostics: a standalone value or expanded id that
 * names no registered item is reported once per Tree instance through the
 * Tree diagnostic channel. The decision lives in diagnostics/unmatched;
 * this hook supplies the live registries and reading order, re-runs when
 * the registry version moves so late registration is seen, and skips the
 * effect entirely in production.
 */
import * as React from 'react'
import {
  findUnmatchedTreeIds,
  registeredInDocumentOrder,
  unmatchedExpandedMessage,
  unmatchedValueMessage,
} from '../diagnostics/unmatched'
import { treeDiagnostic, treeDiagnosticsEnabled } from '../shared/diagnostic'
import type { TreeSession } from './use-tree-session'

export function useTreeDiagnostics(
  session: TreeSession,
  checkedValue: string | null | undefined
): void {
  const { rootRef, liveInstancesRef, branchesMapRef, expanded, registryVersion } = session
  // Ids already reported for this instance. StrictMode's second effect run,
  // and re-renders that pass an equal but new expanded array, never repeat.
  const [reported] = React.useState(() => new Set<string>())

  React.useEffect(() => {
    if (!treeDiagnosticsEnabled()) return
    const registered = liveInstancesRef.current
    const unmatched = findUnmatchedTreeIds({
      registered,
      branches: branchesMapRef.current.keys(),
      expanded,
      value: checkedValue,
    })
    if (!unmatched) return

    const newValue =
      unmatched.value !== null && !reported.has(`value:${unmatched.value}`) ? unmatched.value : null
    const newExpanded = unmatched.expanded.filter((id) => !reported.has(`expanded:${id}`))
    if (newValue === null && newExpanded.length === 0) return

    const domIds = rootRef.current
      ? Array.from(rootRef.current.querySelectorAll<HTMLElement>('[role="treeitem"]'), (el) => el.id)
      : []
    const registeredIds = registeredInDocumentOrder(domIds, registered)

    if (newValue !== null) {
      reported.add(`value:${newValue}`)
      treeDiagnostic(unmatchedValueMessage(newValue, registeredIds))
    }
    if (newExpanded.length > 0) {
      for (const id of newExpanded) reported.add(`expanded:${id}`)
      treeDiagnostic(unmatchedExpandedMessage(newExpanded, registeredIds))
    }
  }, [checkedValue, expanded, registryVersion])
}
