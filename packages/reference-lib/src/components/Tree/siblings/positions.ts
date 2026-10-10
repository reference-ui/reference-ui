/**
 * Tree's sibling-set metadata (TR-DOM-05): counts direct treeitem children
 * only, so authored decorative nodes never corrupt posinset/setsize. Items
 * refresh their container on every commit, groups observe child lists,
 * and the root covers the top level. Takes the narrow DOM surface it
 * needs so tests can prove it against fakes.
 */

export interface TreeitemPositionContainer {
  querySelectorAll(tag: string): ArrayLike<{ setAttribute(name: string, value: string): void }>
}

export function updateContainerTreeitemPositions(container: TreeitemPositionContainer | null) {
  if (!container) return
  const items = Array.from(container.querySelectorAll(':scope > [role="treeitem"]'))
  const total = items.length
  items.forEach((item, idx) => {
    item.setAttribute('aria-posinset', String(idx + 1))
    item.setAttribute('aria-setsize', String(total))
  })
}
