/**
 * Combobox's tree bridge (FEATURES #6): sequenced expansion requests for
 * the nested Tree root. Requests publish only with a sole unconflicted
 * Tree popup open; the Tree routes each through its controlled path
 * exactly once. Combobox never interprets the request it publishes.
 */
import * as React from 'react'
import type { ComboboxTreeExpansionRequest } from '../combobox-context'

export interface TreeBridge {
  treeExpansionRequest: ComboboxTreeExpansionRequest | null
  requestTreeExpansion: (value: string, expand: boolean) => void
}

export function useTreeBridge(
  collectionConflict: boolean,
  isOpen: boolean,
  popupRole: 'listbox' | 'tree' | 'grid'
): TreeBridge {
  // Tree expansion delegation (FEATURES #6): sequenced request state.
  // The nested Tree root consumes it; Combobox never interprets it.
  const [treeExpansionRequest, setTreeExpansionRequest] =
    React.useState<ComboboxTreeExpansionRequest | null>(null)
  const requestTreeExpansion = React.useCallback(
    (value: string, expand: boolean) => {
      if (collectionConflict || !isOpen || popupRole !== 'tree') return
      setTreeExpansionRequest(prev => ({
        value,
        expand,
        seq: (prev?.seq ?? 0) + 1,
      }))
    },
    [collectionConflict, isOpen, popupRole]
  )

  return { treeExpansionRequest, requestTreeExpansion }
}
