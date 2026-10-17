/**
 * Tree's expansion emission: getDeterministicExpanded folds one branch
 * toggle into the expanded array with known branches in current document
 * order and unknown application values trailing in incoming order
 * (TR-EXPAND-06); getBatchExpanded folds a whole sibling set into one
 * emission so asterisk expansion never fires N stale-closure toggles
 * Pure — the expansion hook calls both and emits once.
 */

export function getDeterministicExpanded(
  currentExpanded: string[],
  branchValue: string,
  allKnownBranches: string[],
  isExpanding: boolean
): string[] {
  if (isExpanding) {
    const knownInTree = allKnownBranches.filter(
      (val) => val === branchValue || currentExpanded.includes(val)
    )
    if (!knownInTree.includes(branchValue)) {
      knownInTree.push(branchValue)
    }
    const unknownValues: string[] = []
    for (const val of currentExpanded) {
      if (val !== branchValue && !allKnownBranches.includes(val) && !unknownValues.includes(val)) {
        unknownValues.push(val)
      }
    }
    return [...knownInTree, ...unknownValues]
  } else {
    const remainingKnown = allKnownBranches.filter(
      (val) => val !== branchValue && currentExpanded.includes(val)
    )
    const unknownValues: string[] = []
    for (const val of currentExpanded) {
      if (val !== branchValue && !allKnownBranches.includes(val) && !unknownValues.includes(val)) {
        unknownValues.push(val)
      }
    }
    return [...remainingKnown, ...unknownValues]
  }
}

export function getBatchExpanded(
  currentExpanded: string[],
  idsToExpand: string[],
  allKnownBranches: string[]
): string[] {
  let next = currentExpanded
  for (const id of idsToExpand) {
    if (next.includes(id)) continue
    next = getDeterministicExpanded(next, id, allKnownBranches, true)
  }
  return next
}
