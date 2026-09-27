import * as React from 'react'
import { Div, Button, type PrimitiveProps } from '@reference-ui/react'
import { TypeaheadModel } from '../RovingFocus/typeahead'

// Deterministic expanded-array emission (TR-EXPAND-06): known branches follow
// current document order, unknown application values keep incoming order.
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

// Batch expansion (W-17): fold single-branch deterministic emission over ids
// in the given order, so one onExpandedChange carries the whole set instead
// of N stale-closure toggles. Already-expanded ids are skipped.
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

// Sibling set metadata (TR-DOM-05): counts direct treeitem children only, so
// authored decorative nodes never corrupt posinset/setsize.
function updateContainerTreeitemPositions(container: HTMLElement | null) {
  if (!container) return
  const items = Array.from(container.querySelectorAll<HTMLElement>(':scope > [role="treeitem"]'))
  const total = items.length
  items.forEach((item, idx) => {
    item.setAttribute('aria-posinset', String(idx + 1))
    item.setAttribute('aria-setsize', String(total))
  })
}

function useComposedRefs<T>(
  ...refs: Array<React.ForwardedRef<T> | React.Ref<T> | React.MutableRefObject<T | null> | null | undefined>
) {
  return React.useCallback(
    (node: T | null) => {
      refs.forEach((ref) => {
        if (!ref) return
        if (typeof ref === 'function') {
          ref(node)
        } else if (typeof ref === 'object' && 'current' in ref) {
          ;(ref as React.MutableRefObject<T | null>).current = node
        }
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    refs
  )
}

// Typeahead label extraction (TR-TYPE-04/05): explicit textValue wins; otherwise
// row text without expander/group/hidden content and leading decoration.
// Digits are content, not decoration: \p{Emoji} matches ASCII 0-9, so they are
// carved out — otherwise "0 backups" would search as "backups".
function extractTypeaheadText(el: HTMLElement): string {
  const explicitText = el.getAttribute('data-text-value')
  let text = explicitText ?? ''
  if (!explicitText) {
    const clone = el.cloneNode(true) as HTMLElement
    clone.querySelectorAll('button, [role="group"], [aria-hidden="true"]').forEach((n) => n.remove())
    text = (clone.textContent ?? '').trim()
  }
  return text.replace(/^(?:(?![0-9])[\p{Emoji}\p{Punctuation}\s])+/u, '')
}

// Direction resolution crosses shadow boundaries (TR-ENV-03): closest('[dir]')
// stops at a shadow root, so climb through hosts until the document.
// Light-DOM behavior is unchanged: the first closest() hit wins, and the
// document.dir fallback runs only when no [dir] exists anywhere above.
function resolveIsRtl(rootEl: HTMLElement): boolean {
  let node: Element | null = rootEl
  while (node) {
    const dirEl = node.closest('[dir]')
    if (dirEl) {
      return (dirEl as HTMLElement).dir === 'rtl'
    }
    const host: unknown = (node.getRootNode() as ShadowRoot).host
    if (host instanceof Element) {
      node = host
    } else {
      break
    }
  }
  return typeof document !== 'undefined' && document.dir === 'rtl'
}

function isGroupChild(child: React.ReactNode): boolean {
  return (
    React.isValidElement(child) &&
    (child.type === TreeGroup ||
      (child.type as any)?.displayName === 'TreeGroup' ||
      (child.props as any)?.role === 'group' ||
      (child.props as any)?.['data-testid']?.includes('group'))
  )
}

export type TreeProps = Omit<PrimitiveProps<'div'>, 'onChange' | 'value' | 'defaultValue'> & {
  value: string | null
  onChange: (value: string | null) => void
  expanded?: string[]
  defaultExpanded?: string[]
  onExpandedChange?: (expanded: string[]) => void
  disabled?: boolean
}

interface TreeContextValue {
  value: string | null
  expanded: string[]
  disabled: boolean
  focusedId: string | null
  setFocusedId: (id: string | null) => void
  isItemSelected: (id: string) => boolean
  isItemExpanded: (id: string) => boolean
  selectItem: (id: string) => void
  toggleExpanded: (id: string) => void
  registerItemInstance: (id: string) => () => void
  registerBranchOrder: (id: string, el: HTMLElement | null) => () => void
  handleItemKeyDown: (
    e: React.KeyboardEvent<HTMLDivElement>,
    id: string,
    itemEl: HTMLDivElement | null,
    isBranch: boolean,
    isExpanded: boolean
  ) => void
}

const TreeContext = React.createContext<TreeContextValue | null>(null)

interface TreeItemContextValue {
  id: string
  isBranch: boolean
  isExpanded: boolean
  level: number
  groupId: string
}

const TreeItemContext = React.createContext<TreeItemContextValue | null>(null)
const TreeLevelContext = React.createContext<number>(1)

export type TreeItemProps = PrimitiveProps<'div'> & {
  id?: string
  value?: string
  disabled?: boolean
  isBranch?: boolean
  textValue?: string
}

export const TreeItem = React.forwardRef<HTMLDivElement, TreeItemProps>(
  function TreeItem(
    {
      id: idProp,
      value: valueProp,
      disabled = false,
      isBranch: isBranchProp = false,
      textValue,
      children,
      onClick,
      onKeyDown,
      onFocus,
      className,
      style,
      ...props
    },
    ref
  ) {
    const generatedId = React.useId()
    const id = (valueProp ?? idProp ?? generatedId) as string
    const tree = React.useContext(TreeContext)
    const level = React.useContext(TreeLevelContext) ?? 1
    // Branch semantics follow authored structure: an explicit prop or a nested
    // Group child (TR-DOM-03). Render-time scan keeps SSR deterministic.
    const hasGroupChild = React.useMemo(() => {
      let found = false
      React.Children.forEach(children, (child) => {
        if (!found && isGroupChild(child)) found = true
      })
      return found
    }, [children])
    const isBranch = isBranchProp || hasGroupChild
    const generatedGroupId = React.useId()
    const groupId = idProp ? `${idProp}-group` : `tree-group-${generatedGroupId}`
    const isSelected = tree ? tree.isItemSelected(id) : false
    const isExpanded = tree ? tree.isItemExpanded(id) : false
    const isDisabled = disabled || (tree?.disabled ?? false)

    const isCurrentFocus = tree?.focusedId === id
    const tabIndex = isDisabled ? -1 : isCurrentFocus ? 0 : -1

    const itemRef = React.useRef<HTMLDivElement | null>(null)
    const composedRef = useComposedRefs(ref, itemRef)

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

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If click originated from a button (e.g. Expander), let it handle without selecting
    const target = e.target as HTMLElement
    if (target.closest('button')) {
      return
    }
    // If click originated inside a nested treeitem, let that child treeitem handle it
    if (target.closest('[role="treeitem"]') !== e.currentTarget) {
      return
    }
    e.stopPropagation()
    onClick?.(e)
    if (!e.defaultPrevented && !isDisabled && tree) {
      tree.setFocusedId(id)
      itemRef.current?.focus()
      tree.selectItem(id)
    }
  }

  const handleFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return
    onFocus?.(e)
    if (!e.defaultPrevented && !isDisabled && tree && tree.focusedId !== id) {
      tree.setFocusedId(id)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Editable and interactive descendants keep their own keys (TR-KEY-10)
    if (e.target !== e.currentTarget) return
    onKeyDown?.(e)
    if (e.defaultPrevented || isDisabled || !tree) return

    // Modified keys are not Tree commands (TR-KEY-11)
    if (e.altKey || e.ctrlKey || e.metaKey) {
      return
    }

    tree.handleItemKeyDown(e, id, itemRef.current, isBranch, isExpanded)
  }

  if (isBranch) {
    const rowContent: React.ReactNode[] = []
    const groupContent: React.ReactNode[] = []

    React.Children.forEach(children, (child) => {
      if (isGroupChild(child)) {
        groupContent.push(child)
      } else {
        rowContent.push(child)
      }
    })

    return (
      <TreeItemContext.Provider value={{ id, isBranch, isExpanded, level, groupId }}>
        <Div
          ref={composedRef}
          role="treeitem"
          id={id}
          tabIndex={tabIndex}
          aria-selected={isSelected}
          aria-expanded={isExpanded}
          aria-disabled={isDisabled ? 'true' : undefined}
          aria-level={level}
          aria-posinset={1}
          aria-setsize={1}
          data-state={isSelected ? 'selected' : 'unselected'}
          data-selected={isSelected ? '' : undefined}
          data-expanded={isExpanded ? '' : undefined}
          data-disabled={isDisabled ? '' : undefined}
          data-level={level}
          data-active={isCurrentFocus ? '' : undefined}
          data-text-value={textValue}
          onClick={handleClick}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          display="flex"
          flexDirection="column"
          outline="none"
          userSelect="none"
          cursor={isDisabled ? 'not-allowed' : 'pointer'}
          css={{
            '&:focus-visible > [data-slot="row"]': {
              outline: '2px solid',
              outlineColor: 'var(--colors-ui-focus-ring, {colors.ui.focus.ring})',
              outlineOffset: '-1px',
            },
          }}
          className={className}
          style={style}
          {...props}
        >
          <Div
            data-slot="row"
            display="flex"
            alignItems="center"
            minHeight="8r"
            height="auto"
            p="1.5r"
            gap="1.5r"
            boxSizing="border-box"
            borderRadius="sm"
            fontSize="3.5r"
            lineHeight="5r"
            bg={isSelected ? 'ui.table.row.mutedBackground' : 'transparent'}
            color="design.text.base"
            _hover={
              !isDisabled
                ? { bg: 'ui.table.row.mutedBackground' }
                : undefined
            }
          >
            {rowContent}
          </Div>
          {groupContent}
        </Div>
      </TreeItemContext.Provider>
    )
  }

  return (
    <TreeItemContext.Provider value={{ id, isBranch, isExpanded, level, groupId }}>
      <Div
        ref={composedRef}
        role="treeitem"
        id={id}
        tabIndex={tabIndex}
        aria-selected={isSelected}
        aria-disabled={isDisabled ? 'true' : undefined}
        aria-level={level}
        aria-posinset={1}
        aria-setsize={1}
        data-state={isSelected ? 'selected' : 'unselected'}
        data-selected={isSelected ? '' : undefined}
        data-disabled={isDisabled ? '' : undefined}
        data-level={level}
        data-active={isCurrentFocus ? '' : undefined}
        data-text-value={textValue}
        onClick={handleClick}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        display="flex"
        alignItems="center"
        minHeight="8r"
        height="auto"
        p="1.5r"
        gap="1.5r"
        boxSizing="border-box"
        borderRadius="sm"
        fontSize="3.5r"
        lineHeight="5r"
        outline="none"
        userSelect="none"
        cursor={isDisabled ? 'not-allowed' : 'pointer'}
        bg={isSelected ? 'ui.table.row.mutedBackground' : 'transparent'}
        color="design.text.base"
        _hover={
          !isDisabled
            ? { bg: 'ui.table.row.mutedBackground' }
            : undefined
        }
        _focusVisible={{
          outline: '2px solid',
          outlineColor: 'ui.focus.ring',
          outlineOffset: '-1px',
        }}
        className={className}
        style={style}
        {...props}
      >
        {children}
      </Div>
    </TreeItemContext.Provider>
  )
  }
)
TreeItem.displayName = 'TreeItem'

export type TreeGroupProps = PrimitiveProps<'div'>

export const TreeGroup = React.forwardRef<HTMLDivElement, TreeGroupProps>(
  function TreeGroup({ children, id: idProp, className, style, ...props }, ref) {
    const itemContext = React.useContext(TreeItemContext)
    const tree = React.useContext(TreeContext)
    const groupRef = React.useRef<HTMLDivElement | null>(null)
    const composedRef = useComposedRefs(ref, groupRef)

    // If inside a branch item, only render when that branch is expanded
    const isParentExpanded = itemContext?.isBranch
      ? tree?.isItemExpanded(itemContext.id) ?? true
      : true

    const nextLevel = (itemContext?.level ?? 1) + 1
    const groupId = idProp ?? itemContext?.groupId

    // Sibling set metadata stays current as children mount/unmount (TR-DOM-05)
    React.useLayoutEffect(() => {
      if (!isParentExpanded) return
      const container = groupRef.current
      if (!container) return
      updateContainerTreeitemPositions(container)
      const observer = new MutationObserver(() => {
        updateContainerTreeitemPositions(container)
      })
      observer.observe(container, { childList: true })
      return () => observer.disconnect()
    }, [isParentExpanded])

    if (!isParentExpanded) {
      return null
    }

    return (
      <TreeLevelContext.Provider value={nextLevel}>
        <Div
          ref={composedRef}
          role="group"
          id={groupId}
          pl="7.5r"
          display="flex"
          flexDirection="column"
          gap="0.5r"
          className={className}
          style={style}
          {...props}
        >
          {children}
        </Div>
      </TreeLevelContext.Provider>
    )
  }
)
TreeGroup.displayName = 'TreeGroup'

export type TreeExpanderProps = PrimitiveProps<'button'> & {
  expanded?: boolean
  onToggle?: () => void
  itemId?: string
}

export const TreeExpander = React.forwardRef<HTMLButtonElement, TreeExpanderProps>(
  function TreeExpander(
    {
      expanded: expandedProp,
      onToggle,
      itemId: itemIdProp,
      children,
      className,
      style,
      onClick,
      ...props
    },
    ref
  ) {
    const tree = React.useContext(TreeContext)
    const itemContext = React.useContext(TreeItemContext)
    const itemId = itemIdProp ?? itemContext?.id ?? ''

    // Stateless if `expanded` is explicitly passed; otherwise falls back to context
    const isExpanded =
      expandedProp !== undefined
        ? expandedProp
        : tree?.isItemExpanded(itemId) ?? itemContext?.isExpanded ?? false

    const groupId = itemContext?.groupId

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      onClick?.(e)
      onToggle?.()
      if (!e.defaultPrevented && itemId && tree && expandedProp === undefined) {
        // A disabled branch never requests expansion (TR-EXPAND-09)
        const itemEl = e.currentTarget.closest('[role="treeitem"]')
        if (itemEl?.getAttribute('aria-disabled') === 'true') {
          return
        }
        tree.toggleExpanded(itemId)
      }
    }

    return (
      <Button
        ref={ref}
        type="button"
        tabIndex={-1}
        aria-label={isExpanded ? 'Collapse' : 'Expand'}
        aria-expanded={isExpanded}
        aria-controls={groupId}
        onClick={handleClick}
      border="none"
      bg="transparent"
      color="inherit"
      cursor="pointer"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      width="6r"
      height="6r"
      p="0"
      flexShrink={0}
      borderRadius="xs"
      _hover={{
        color: 'inherit',
        bg: 'color-mix(in oklch, currentColor 14%, transparent)',
      }}
      className={className}
      style={style}
      {...props}
    >
      {children ?? (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      )}
      </Button>
    )
  }
)
TreeExpander.displayName = 'TreeExpander'

export const Tree = React.forwardRef<HTMLDivElement, TreeProps>(
  function Tree(
    {
      children,
      value,
      onChange,
      expanded: expandedProp,
      defaultExpanded = [],
      onExpandedChange,
      disabled = false,
      className,
      style,
      ...props
    },
    ref
  ) {
    // Fully controlled selection: value is required (null is the empty
    // value) and onChange is required — a callback-less tree would freeze
    // silently. Render-phase pure checks: StrictMode-safe.
    if (value === undefined) {
      throw new Error(
        'Reference UI: Tree "value" is required — the tree is fully controlled, with null as the empty value.'
      )
    }
    if (onChange === undefined) {
      throw new Error(
        'Reference UI: Tree "onChange" is required — the tree is fully controlled; pass a handler that writes selection state back.'
      )
    }

    const isControlledExpanded = expandedProp !== undefined
    const [internalExpanded, setInternalExpanded] = React.useState<string[]>(defaultExpanded)
    const expanded = isControlledExpanded ? expandedProp : internalExpanded

    const [focusedId, setFocusedId] = React.useState<string | null>(null)
    const rootRef = React.useRef<HTMLDivElement | null>(null)

    // Live identity registry for duplicate detection (TR-DOM-08)
    const liveInstancesRef = React.useRef<Set<string>>(new Set())
    const registerItemInstance = React.useCallback((id: string) => {
      if (liveInstancesRef.current.has(id)) {
        throw new Error(`Tree items must have unique values. Duplicate found: "${id}".`)
      }
      liveInstancesRef.current.add(id)
      return () => {
        liveInstancesRef.current.delete(id)
      }
    }, [])

    // Branch order tracking for deterministic expansion payloads (TR-EXPAND-06)
    const branchesMapRef = React.useRef<Map<string, HTMLElement | null>>(new Map())
    const registerBranchOrder = React.useCallback((id: string, el: HTMLElement | null) => {
      branchesMapRef.current.set(id, el)
      return () => {
        branchesMapRef.current.delete(id)
      }
    }, [])

    // Shared RovingFocus typeahead session over the visible set (TR-TYPE-04)
    const typeaheadModelRef = React.useRef<TypeaheadModel | null>(null)
    if (typeaheadModelRef.current === null) {
      typeaheadModelRef.current = new TypeaheadModel({ timeoutMs: 500 })
    }

    const isItemSelected = React.useCallback(
      (id: string) => value === id,
      [value]
    )

    const isItemExpanded = React.useCallback(
      (id: string) => expanded.includes(id),
      [expanded]
    )

    const selectItem = React.useCallback(
      (id: string) => {
        // Single selection is idempotent, not a toggle (TR-SELECT-03)
        if (value === id) {
          return
        }
        onChange(id)
      },
      [onChange, value]
    )

    // Live branches in current document order for deterministic payloads
    const getOrderedBranches = React.useCallback(() => {
      return Array.from(branchesMapRef.current.entries())
        .filter(([, el]) => el && el.isConnected)
        .sort(([, a], [, b]) => {
          const pos = a!.compareDocumentPosition(b!)
          if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1
          if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1
          return 0
        })
        .map(([val]) => val)
    }, [])

    const toggleExpanded = React.useCallback(
      (id: string) => {
        const isCurrentlyExpanded = expanded.includes(id)
        // If about to collapse id and currently focused item is a descendant, move focus to branch first
        if (isCurrentlyExpanded) {
          const rootEl = rootRef.current
          if (rootEl && focusedId && focusedId !== id) {
            const branchEl = rootEl.querySelector<HTMLElement>(`[id="${CSS.escape(id)}"]`)
            const focusedEl = rootEl.querySelector<HTMLElement>(`[id="${CSS.escape(focusedId)}"]`)
            if (branchEl && focusedEl && branchEl.contains(focusedEl)) {
              setFocusedId(id)
              branchEl.focus()
            }
          }
        }

        const next = getDeterministicExpanded(expanded, id, getOrderedBranches(), !isCurrentlyExpanded)
        if (!isControlledExpanded) {
          setInternalExpanded(next)
        }
        onExpandedChange?.(next)
      },
      [expanded, isControlledExpanded, onExpandedChange, focusedId, getOrderedBranches]
    )

    // Batch expansion (W-17): one deterministic emission for a whole sibling
    // set. Callers skip the call when there is nothing new to expand, so a
    // no-op asterisk never emits a redundant onExpandedChange.
    const expandItems = React.useCallback(
      (ids: string[]) => {
        const next = getBatchExpanded(expanded, ids, getOrderedBranches())
        if (!isControlledExpanded) {
          setInternalExpanded(next)
        }
        onExpandedChange?.(next)
      },
      [expanded, isControlledExpanded, onExpandedChange, getOrderedBranches]
    )

    // Ensure initial or recovered roving focus tab stop (tabIndex=0)
    React.useEffect(() => {
      const rootEl = rootRef.current
      if (!rootEl) return

      const visibleItems = Array.from(
        rootEl.querySelectorAll<HTMLElement>('[role="treeitem"]:not([aria-disabled="true"])')
      )
      if (visibleItems.length === 0) return

      if (!focusedId || !visibleItems.some((el) => el.id === focusedId)) {
        const selectedEl = value ? visibleItems.find((el) => el.id === value) : null
        const target = selectedEl ?? visibleItems[0]
        if (target) {
          setFocusedId(target.id)
        }
      }
    }, [focusedId, value, expanded])

    // Top-level sibling set metadata (TR-DOM-05)
    React.useLayoutEffect(() => {
      const container = rootRef.current
      if (!container) return
      updateContainerTreeitemPositions(container)
      const observer = new MutationObserver(() => {
        updateContainerTreeitemPositions(container)
      })
      observer.observe(container, { childList: true })
      return () => observer.disconnect()
    }, [])

    // Focus recovery when the focused item is removed (TR-DYNAMIC-03)
    const prevVisibleValuesRef = React.useRef<string[]>([])
    React.useLayoutEffect(() => {
      const rootEl = rootRef.current
      if (!rootEl) return

      const visibleItems = Array.from(
        rootEl.querySelectorAll<HTMLElement>('[role="treeitem"]:not([aria-disabled="true"])')
      )
      const currentValues = visibleItems.map((el) => el.id)

      if (focusedId !== null && !currentValues.includes(focusedId)) {
        const oldIndex = prevVisibleValuesRef.current.indexOf(focusedId)
        let candidate: HTMLElement | null = null

        if (visibleItems.length > 0) {
          if (oldIndex !== -1 && oldIndex < visibleItems.length) {
            candidate = visibleItems[oldIndex]
          } else {
            candidate = visibleItems[visibleItems.length - 1]
          }
        }

        if (candidate) {
          setFocusedId(candidate.id)
          candidate.focus()
        } else {
          setFocusedId(null)
          rootEl.setAttribute('tabindex', '-1')
          rootEl.focus()
        }
      }

      prevVisibleValuesRef.current = currentValues
    })

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

    const contextValue = React.useMemo<TreeContextValue>(
      () => ({
        value,
        expanded,
        disabled,
        focusedId,
        setFocusedId,
        isItemSelected,
        isItemExpanded,
        selectItem,
        toggleExpanded,
        registerItemInstance,
        registerBranchOrder,
        handleItemKeyDown,
      }),
      [
        value,
        expanded,
        disabled,
        focusedId,
        isItemSelected,
        isItemExpanded,
        selectItem,
        toggleExpanded,
        registerItemInstance,
        registerBranchOrder,
        handleItemKeyDown,
      ]
    )

    const composedRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        rootRef.current = node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref && typeof ref === 'object' && 'current' in ref) {
          ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = node
        }
      },
      [ref]
    )

    return (
      <TreeContext.Provider value={contextValue}>
        <TreeLevelContext.Provider value={1}>
          <Div
            ref={composedRef}
            role="tree"
            data-reference-tree=""
            data-disabled={disabled ? '' : undefined}
            display="flex"
            flexDirection="column"
            gap="0.5r"
            outline="none"
            className={className}
            style={style}
            {...props}
          >
            {children}
          </Div>
        </TreeLevelContext.Provider>
      </TreeContext.Provider>
    )
  }
) as React.ForwardRefExoticComponent<TreeProps & React.RefAttributes<HTMLDivElement>> & {
  Root: typeof Tree
  Item: typeof TreeItem
  Group: typeof TreeGroup
  Expander: typeof TreeExpander
}

Tree.Root = Tree
Tree.Item = TreeItem
Tree.Group = TreeGroup
Tree.Expander = TreeExpander
