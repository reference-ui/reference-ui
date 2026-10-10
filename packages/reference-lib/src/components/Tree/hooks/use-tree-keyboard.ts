/**
 * Tree's keyboard commands: the item keydown dispatcher items delegate
 * to. Arrows rove and traverse hierarchy with RTL mirroring, Home/End
 * jump, Enter selects, Space extends an active typeahead buffer or
 * selects, asterisk expands sibling branches (APG, W-17), and printable
 * keys search the shared typeahead session over the visible set. Pure
 * direction choice lives in navigation/direction; labels in
 * typeahead/labels; this hook owns queries, focus moves, and commits.
 */
import * as React from 'react'
import { resolveIsRtl } from '../navigation/direction'
import { extractTypeaheadText } from '../typeahead/labels'
import type { TreeSession } from './use-tree-session'

export type TreeItemKeyDownHandler = (
  e: React.KeyboardEvent<HTMLDivElement>,
  id: string,
  itemEl: HTMLDivElement | null,
  isBranch: boolean,
  isExpanded: boolean
) => void

export function useTreeKeyboard(
  session: TreeSession,
  toggleExpanded: (id: string) => void,
  expandItems: (ids: string[]) => void,
  selectItem: (id: string) => void
): TreeItemKeyDownHandler {
  const { rootRef, typeaheadModelRef, setFocusedId } = session

  const typeaheadSearch = React.useCallback((char: string, currentId: string) => {
    const rootEl = rootRef.current
    if (!rootEl) return

    const visibleItems = Array.from(
      rootEl.querySelectorAll<HTMLElement>('[role="treeitem"]:not([aria-disabled="true"])')
    )
    if (visibleItems.length === 0) return

    const items = visibleItems.map((el) => ({
      id: el.id,
      text: extractTypeaheadText(el),
      disabled: el.getAttribute('aria-disabled') === 'true',
    }))

    const matchId = typeaheadModelRef.current?.handleKey(char, currentId, items)
    if (matchId && matchId !== currentId) {
      const matchEl = visibleItems.find((el) => el.id === matchId)
      if (matchEl) {
        setFocusedId(matchId)
        matchEl.focus()
      }
    }
  }, [])

  const handleItemKeyDown = React.useCallback(
    (
      e: React.KeyboardEvent<HTMLDivElement>,
      id: string,
      itemEl: HTMLDivElement | null,
      isBranch: boolean,
      isExpanded: boolean
    ) => {
      const rootEl = rootRef.current
      if (!rootEl || !itemEl) return

      const visibleItems = Array.from(
        rootEl.querySelectorAll<HTMLElement>('[role="treeitem"]:not([aria-disabled="true"])')
      )
      const currentIndex = visibleItems.findIndex((el) => el.id === id || el === itemEl)
      if (currentIndex === -1) return

      const isRtl = resolveIsRtl(rootEl)
      const expandKey = isRtl ? 'ArrowLeft' : 'ArrowRight'
      const collapseKey = isRtl ? 'ArrowRight' : 'ArrowLeft'

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault()
          if (currentIndex < visibleItems.length - 1) {
            const next = visibleItems[currentIndex + 1]
            setFocusedId(next.id)
            next.focus()
          }
          break
        }

        case 'ArrowUp': {
          e.preventDefault()
          if (currentIndex > 0) {
            const prev = visibleItems[currentIndex - 1]
            setFocusedId(prev.id)
            prev.focus()
          }
          break
        }

        case expandKey: {
          if (isBranch) {
            if (!isExpanded) {
              e.preventDefault()
              toggleExpanded(id)
            } else {
              // Focus first enabled child
              const group = itemEl.querySelector(':scope > [role="group"]')
              const firstChild = group?.querySelector<HTMLElement>(
                ':scope > [role="treeitem"]:not([aria-disabled="true"])'
              )
              if (firstChild) {
                e.preventDefault()
                setFocusedId(firstChild.id)
                firstChild.focus()
              } else if (currentIndex < visibleItems.length - 1) {
                const next = visibleItems[currentIndex + 1]
                if (itemEl.contains(next)) {
                  e.preventDefault()
                  setFocusedId(next.id)
                  next.focus()
                }
              }
            }
          }
          break
        }

        case collapseKey: {
          if (isBranch && isExpanded) {
            e.preventDefault()
            toggleExpanded(id)
          } else {
            // Move to parent treeitem
            const parentGroup = itemEl.parentElement?.closest('[role="group"]')
            const parentItem = parentGroup?.closest<HTMLElement>('[role="treeitem"]')
            if (parentItem && rootEl.contains(parentItem)) {
              e.preventDefault()
              setFocusedId(parentItem.id)
              parentItem.focus()
            }
          }
          break
        }

        case 'Home': {
          e.preventDefault()
          if (visibleItems.length > 0) {
            const first = visibleItems[0]
            setFocusedId(first.id)
            first.focus()
          }
          break
        }

        case 'End': {
          e.preventDefault()
          if (visibleItems.length > 0) {
            const last = visibleItems[visibleItems.length - 1]
            setFocusedId(last.id)
            last.focus()
          }
          break
        }

        case 'Enter': {
          e.preventDefault()
          selectItem(id)
          break
        }

        case ' ': {
          // Space extends an active typeahead buffer, else selects (TR-TYPE-04)
          if (typeaheadModelRef.current?.hasBuffer()) {
            e.preventDefault()
            typeaheadSearch(' ', id)
          } else {
            e.preventDefault()
            selectItem(id)
          }
          break
        }

        case '*': {
          // APG asterisk (W-17): closed branch expands itself; open branch
          // expands every closed sibling branch; leaf expands the first
          // closed sibling branch. Focus never moves, and * never enters
          // the typeahead buffer. Direction-independent (RTL unaffected).
          e.preventDefault()
          const container = itemEl.parentElement?.closest<HTMLElement>(
            '[role="group"], [role="tree"]'
          )
          const siblings = container
            ? Array.from(
                container.querySelectorAll<HTMLElement>(':scope > [role="treeitem"]')
              )
            : []
          // Branches own aria-expanded; leaves never render it (TR-DOM-03).
          // Disabled branches stay expansion-controlled (TR-EXPAND-09).
          const isClosedBranch = (el: HTMLElement) =>
            el.getAttribute('aria-expanded') === 'false' &&
            el.getAttribute('aria-disabled') !== 'true'
          if (!isBranch) {
            const first = siblings.find(isClosedBranch)
            if (first) {
              expandItems([first.id])
            }
          } else if (!isExpanded) {
            expandItems([id])
          } else {
            const toExpand = siblings.filter(isClosedBranch).map((el) => el.id)
            if (toExpand.length > 0) {
              expandItems(toExpand)
            }
          }
          break
        }

        default: {
          if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            e.preventDefault()
            typeaheadSearch(e.key, id)
          }
          break
        }
      }
      },
    [toggleExpanded, expandItems, selectItem, typeaheadSearch]
  )

  return handleItemKeyDown
}
