/**
 * Tree's unmatched-id decision: which controlled ids name no registered
 * item, and the wording that reports them. A collapsed Group unmounts its
 * children, so an unregistered id may simply sit under a collapsed branch;
 * absence is evidence only when the whole tree is mounted (at least one
 * item registered and every registered branch expanded). Otherwise the
 * decision is undecidable and returns null. Pure: the hook supplies the
 * registry snapshot and document order, and this module decides.
 */

export interface TreeIdSnapshot {
  /** Every registered item id, branches and leaves alike. */
  registered: ReadonlySet<string>
  /** Every registered branch id. */
  branches: Iterable<string>
  /** The expanded array as the Tree reads it (controlled or internal). */
  expanded: readonly string[]
  /** Standalone selection. null is the empty value; undefined skips the check. */
  value: string | null | undefined
}

export interface TreeUnmatchedIds {
  /** The selected value when it names no item, else null. */
  value: string | null
  /** Expanded ids that name no item, deduplicated, in incoming order. */
  expanded: string[]
}

export function findUnmatchedTreeIds(snapshot: TreeIdSnapshot): TreeUnmatchedIds | null {
  const { registered, branches, expanded, value } = snapshot
  if (registered.size === 0) return null

  const expandedSet = new Set(expanded)
  for (const branch of branches) {
    // A collapsed branch hides its descendants, so a missing id proves nothing.
    if (!expandedSet.has(branch)) return null
  }

  const unmatchedValue = typeof value === 'string' && !registered.has(value) ? value : null
  const unmatchedExpanded = new Set<string>()
  for (const id of expanded) {
    if (!registered.has(id)) unmatchedExpanded.add(id)
  }
  if (unmatchedValue === null && unmatchedExpanded.size === 0) return null
  return { value: unmatchedValue, expanded: [...unmatchedExpanded] }
}

/**
 * Registered ids in reading order: the DOM ids first, then any registered
 * id the DOM did not list, in registration order. Keeps warnings readable
 * for nested trees, where registration order is post-order.
 */
export function registeredInDocumentOrder(
  domIds: readonly string[],
  registered: ReadonlySet<string>
): string[] {
  const ordered: string[] = []
  const seen = new Set<string>()
  for (const id of [...domIds, ...registered]) {
    if (registered.has(id) && !seen.has(id)) {
      seen.add(id)
      ordered.push(id)
    }
  }
  return ordered
}

export function unmatchedValueMessage(value: string, registeredIds: readonly string[]): string {
  return `value "${value}" matches no item (registered ids: ${registeredIds.join(', ')}).`
}

export function unmatchedExpandedMessage(
  ids: readonly string[],
  registeredIds: readonly string[]
): string {
  const named = ids.map((id) => `"${id}"`).join(', ')
  return `expanded contains ${named} matching no item (registered ids: ${registeredIds.join(', ')}); unknown ids are kept and passed through.`
}
