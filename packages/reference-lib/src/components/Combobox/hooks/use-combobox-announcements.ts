/**
 * Combobox's async status (FEATURES #4): busy sync onto nested frozen
 * collections (grid popovers carry busy as a prop; Listbox/Tree nodes
 * get the attribute synced onto the mounted node), and empty/no-results
 * prose through the shared announcer — once per entry into the state,
 * never a private live region. An authored Empty node suppresses the
 * announcement; its native live region speaks for itself.
 */
import * as React from 'react'
import { announce } from '../../Announcer'
import type { ComboboxSession } from './use-combobox-session'

export function useComboboxAnnouncements(
  session: ComboboxSession,
  args: {
    loading: boolean
    popupRole: 'listbox' | 'tree' | 'grid'
    hasPopoverContent: boolean
    emptyAuthored: boolean
    selectOnly: boolean
    emptyMessage: string
    noResultsMessage: string
  }
) {
  const { isOpen, popoverId, optionsVersion, inputValue, sourceRef, announcedEmptyRef } = session
  const { loading, popupRole, hasPopoverContent, emptyAuthored, selectOnly, emptyMessage, noResultsMessage } = args

  // FEATURES #4: busy sync for nested (frozen) collections. Grid popovers
  // carry busy as a React prop; Listbox/Tree nodes have no prop channel
  // (frozen parts), so the attribute syncs onto the mounted node and is
  // removed on cleanup. SSR-safe; resolves in the source's own root so
  // shadow popovers stay in-root (CB-ENV-03).
  React.useEffect(() => {
    if (typeof document === 'undefined') return
    if (!isOpen || !loading || popupRole === 'grid') return
    const rootNode = sourceRef.current?.getRootNode?.() as
      | Document
      | ShadowRoot
      | null
      | undefined
    const scope = rootNode ?? document
    const getById = (scope as Document).getElementById?.bind(scope)
    if (typeof getById !== 'function') return
    const popoverEl = getById(popoverId)
    const collectionEl =
      popoverEl?.querySelector?.('[role="listbox"], [role="tree"]') ?? null
    if (!collectionEl) return
    collectionEl.setAttribute('aria-busy', 'true')
    return () => {
      collectionEl.removeAttribute('aria-busy')
    }
  }, [isOpen, loading, popupRole, popoverId, optionsVersion])

  // FEATURES #4: empty/no-results status through the shared announcer —
  // once per entry into the state, never a private live region. Fires
  // only while open, idle (not loading), and logically empty; an
  // authored Empty node suppresses it (its native live region speaks).
  // Select-only popovers use the empty message (no text to mismatch).
  React.useEffect(() => {
    if (!isOpen || loading || hasPopoverContent || emptyAuthored) {
      announcedEmptyRef.current = null
      return
    }
    const key = !selectOnly && inputValue !== '' ? 'none' : 'empty'
    if (announcedEmptyRef.current === key) return
    announcedEmptyRef.current = key
    announce(key === 'none' ? noResultsMessage : emptyMessage)
  }, [
    isOpen,
    loading,
    hasPopoverContent,
    emptyAuthored,
    selectOnly,
    inputValue,
    emptyMessage,
    noResultsMessage,
  ])
}
