/**
 * Tree's unmatched-id diagnostics: a standalone value or expanded id that
 * names no registered item is reported once per Tree instance through the
 * Tree diagnostic channel. The decision lives in diagnostics/unmatched;
 * this hook supplies the live registries and reading order, re-runs when
 * the registry version moves so late registration is seen, and skips the
 * effect entirely in production. The report waits for the registry to
 * settle: each registration re-runs the effect, which cancels the pending
 * report and decides again, so an id is named only if it is still unmatched
 * once the registry has been quiet for TREE_UNMATCHED_SETTLE_MS.
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

// Quiet window before an unmatched id is reported. A child that mounts on the
// next commit, or after a short timer, registers inside it and is not named.
const TREE_UNMATCHED_SETTLE_MS = 50

interface UnreportedIds {
  value: string | null
  expanded: string[]
}

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

    // Unmatched ids not yet reported, read from the live registries. It is
    // asked now and again when the window closes, so the report names what is
    // still unmatched then, not what was unmatched at the last commit.
    const unreportedIds = (): UnreportedIds | null => {
      const unmatched = findUnmatchedTreeIds({
        registered: liveInstancesRef.current,
        branches: branchesMapRef.current.keys(),
        expanded,
        value: checkedValue,
      })
      if (!unmatched) return null
      const value =
        unmatched.value !== null && !reported.has(`value:${unmatched.value}`)
          ? unmatched.value
          : null
      const expandedIds = unmatched.expanded.filter((id) => !reported.has(`expanded:${id}`))
      return value === null && expandedIds.length === 0 ? null : { value, expanded: expandedIds }
    }

    const report = ({ value, expanded: expandedIds }: UnreportedIds) => {
      const domIds = rootRef.current
        ? Array.from(
            rootRef.current.querySelectorAll<HTMLElement>('[role="treeitem"]'),
            (el) => el.id
          )
        : []
      const registeredIds = registeredInDocumentOrder(domIds, liveInstancesRef.current)

      if (value !== null) {
        reported.add(`value:${value}`)
        treeDiagnostic(unmatchedValueMessage(value, registeredIds))
      }
      if (expandedIds.length > 0) {
        for (const id of expandedIds) reported.add(`expanded:${id}`)
        treeDiagnostic(unmatchedExpandedMessage(expandedIds, registeredIds))
      }
    }

    if (!unreportedIds()) return
    // Every registry change re-runs this effect and clears the timer, so the
    // report fires only after the registry has been quiet for the whole window.
    const timer = setTimeout(() => {
      const pending = unreportedIds()
      if (pending) report(pending)
    }, TREE_UNMATCHED_SETTLE_MS)
    return () => clearTimeout(timer)
  }, [checkedValue, expanded, registryVersion])
}
