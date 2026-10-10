/**
 * Tree item registration: the Combobox registry entry when nested
 * (visible-only by mount/unmount, since collapsed groups unmount),
 * duplicate-identity rejection before focus goes ambiguous (TR-DOM-08),
 * sibling metadata refresh on every commit (TR-DOM-05), and branch-order
 * registration for deterministic expansion payloads. Deps mirror the
 * original inline effects exactly.
 */
import * as React from 'react'
import type { ComboboxContextValue } from '../../Combobox/combobox-context'
import { updateContainerTreeitemPositions } from '../siblings/positions'
import { extractTypeaheadText } from '../typeahead/labels'
import type { TreeContextValue } from '../types'

export interface TreeItemRegistration {
  tree: TreeContextValue | null
  combobox: ComboboxContextValue | null
  id: string
  isBranch: boolean
  isDisabled: boolean
  textValue: string | undefined
  children: React.ReactNode
  itemRef: React.RefObject<HTMLDivElement | null>
}

export function useTreeItemRegistration({
  tree,
  combobox,
  id,
  isBranch,
  isDisabled,
  textValue,
  children,
  itemRef,
}: TreeItemRegistration) {
  // TR-CB-01/05: nested items join the Combobox registry — visible-only
  // by mount/unmount, since collapsed Groups unmount. Branches flag
  // isBranch; leaves omit it. Registry order follows live DOM order, so
  // expand/collapse/reorder stay current without explicit sync.
  React.useEffect(() => {
    if (!combobox) return
    const node =
      itemRef.current ??
      (typeof document !== 'undefined'
        ? (document.getElementById(id) as HTMLElement | null)
        : null)
    return combobox.registerOption({
      value: id,
      id,
      node,
      disabled: isDisabled,
      textValue: textValue ?? (node ? extractTypeaheadText(node) : undefined),
      isBranch: isBranch || undefined,
    })
  }, [combobox, id, isDisabled, textValue, isBranch, children])

  // Reject duplicate item identities before focus/selection goes ambiguous (TR-DOM-08)
  const registerItemInstance = tree?.registerItemInstance
  React.useEffect(() => {
    if (registerItemInstance) {
      return registerItemInstance(id)
    }
  }, [registerItemInstance, id])

  // Sibling set metadata stays current as items mount/unmount (TR-DOM-05)
  React.useLayoutEffect(() => {
    const el = itemRef.current
    if (!el) return
    const container = el.parentElement?.closest<HTMLElement>('[role="group"], [role="tree"]')
    updateContainerTreeitemPositions(container ?? null)
  })

  // Branch order registration for deterministic expansion payloads (TR-EXPAND-06)
  const registerBranchOrder = tree?.registerBranchOrder
  React.useLayoutEffect(() => {
    if (registerBranchOrder && isBranch) {
      return registerBranchOrder(id, itemRef.current)
    }
  }, [registerBranchOrder, isBranch, id])
}
