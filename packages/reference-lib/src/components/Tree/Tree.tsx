import * as React from 'react'
import { Div, Button, type PrimitiveProps } from '@reference-ui/react'

export type TreeProps = Omit<PrimitiveProps<'div'>, 'onChange' | 'value' | 'defaultValue'> & {
  value?: string | null
  defaultValue?: string | null
  onChange?: (value: string | null) => void
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
  setFocusedId: (id: string) => void
  isItemSelected: (id: string) => boolean
  isItemExpanded: (id: string) => boolean
  selectItem: (id: string) => void
  toggleExpanded: (id: string) => void
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
}

const TreeItemContext = React.createContext<TreeItemContextValue | null>(null)
const TreeLevelContext = React.createContext<number>(1)

export type TreeItemProps = PrimitiveProps<'div'> & {
  id: string
  disabled?: boolean
  isBranch?: boolean
  textValue?: string
}

export function TreeItem({
  id,
  disabled = false,
  isBranch = false,
  textValue,
  children,
  onClick,
  onKeyDown,
  onFocus,
  className,
  style,
  ...props
}: TreeItemProps) {
  const tree = React.useContext(TreeContext)
  const level = React.useContext(TreeLevelContext) ?? 1
  const isSelected = tree ? tree.isItemSelected(id) : false
  const isExpanded = tree ? tree.isItemExpanded(id) : false
  const isDisabled = disabled || (tree?.disabled ?? false)

  const isCurrentFocus = tree?.focusedId === id
  const tabIndex = isDisabled ? -1 : isCurrentFocus ? 0 : -1

  const itemRef = React.useRef<HTMLDivElement | null>(null)

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
    if (e.target !== e.currentTarget) return
    onKeyDown?.(e)
    if (e.defaultPrevented || isDisabled || !tree) return

    // Do not hijack typing or navigation if inside an input or textarea
    const target = e.target as HTMLElement
    if (
      target !== e.currentTarget &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable)
    ) {
      return
    }

    tree.handleItemKeyDown(e, id, itemRef.current, isBranch, isExpanded)
  }

  return (
    <TreeItemContext.Provider value={{ id, isBranch, isExpanded, level }}>
      <Div
        ref={itemRef}
        role="treeitem"
        id={id}
        tabIndex={tabIndex}
        aria-selected={isSelected}
        aria-expanded={isBranch ? isExpanded : undefined}
        aria-disabled={isDisabled ? 'true' : undefined}
        aria-level={level}
        data-state={isSelected ? 'selected' : 'unselected'}
        data-expanded={isBranch && isExpanded ? '' : undefined}
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
        borderRadius="sm"
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

export type TreeGroupProps = PrimitiveProps<'div'>

export function TreeGroup({
  children,
  className,
  style,
  ...props
}: TreeGroupProps) {
  const itemContext = React.useContext(TreeItemContext)
  const tree = React.useContext(TreeContext)

  // If inside a branch item, only render when that branch is expanded
  const isParentExpanded = itemContext?.isBranch
    ? tree?.isItemExpanded(itemContext.id) ?? true
    : true

  if (!isParentExpanded) {
    return null
  }

  const nextLevel = (itemContext?.level ?? 1) + 1

  return (
    <TreeLevelContext.Provider value={nextLevel}>
      <Div
        role="group"
        pl="4r"
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

export type TreeExpanderProps = PrimitiveProps<'button'> & {
  itemId?: string
}

export function TreeExpander({
  itemId: itemIdProp,
  children,
  className,
  style,
  onClick,
  ...props
}: TreeExpanderProps) {
  const tree = React.useContext(TreeContext)
  const itemContext = React.useContext(TreeItemContext)
  const itemId = itemIdProp ?? itemContext?.id ?? ''
  const isExpanded = tree?.isItemExpanded(itemId) ?? false

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    onClick?.(e)
    if (!e.defaultPrevented && itemId && tree) {
      tree.toggleExpanded(itemId)
    }
  }

  return (
    <Button
      type="button"
      tabIndex={-1}
      aria-label={isExpanded ? 'Collapse' : 'Expand'}
      aria-hidden="true"
      onClick={handleClick}
      border="none"
      bg="transparent"
      color="design.text.light"
      cursor="pointer"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      p="0.5r"
      fontSize="2.5r"
      lineHeight="1"
      borderRadius="sm"
      _hover={{
        color: 'design.text.base',
        bg: 'ui.button.mutedBackground',
      }}
      className={className}
      style={style}
      {...props}
    >
      {children ?? (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 150ms ease',
          }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      )}
    </Button>
  )
}

export const Tree = React.forwardRef<HTMLDivElement, TreeProps>(
  function Tree(
    {
      children,
      value: valueProp,
      defaultValue = null,
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
    const isControlledValue = valueProp !== undefined
    const [internalValue, setInternalValue] = React.useState<string | null>(defaultValue)
    const value = isControlledValue ? valueProp : internalValue

    const isControlledExpanded = expandedProp !== undefined
    const [internalExpanded, setInternalExpanded] = React.useState<string[]>(defaultExpanded)
    const expanded = isControlledExpanded ? expandedProp : internalExpanded

    const [focusedId, setFocusedId] = React.useState<string | null>(null)
    const rootRef = React.useRef<HTMLDivElement | null>(null)

    const typeaheadBufferRef = React.useRef<string>('')
    const typeaheadTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

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
        if (!isControlledValue) {
          setInternalValue(id)
        }
        onChange?.(id)
      },
      [isControlledValue, onChange]
    )

    const toggleExpanded = React.useCallback(
      (id: string) => {
        // If about to collapse id and currently focused item is a descendant, move focus to branch first
        if (expanded.includes(id)) {
          const rootEl = rootRef.current
          if (rootEl && focusedId && focusedId !== id) {
            const branchEl = rootEl.querySelector<HTMLElement>(`[id="${id}"]`)
            const focusedEl = rootEl.querySelector<HTMLElement>(`[id="${focusedId}"]`)
            if (branchEl && focusedEl && branchEl.contains(focusedEl)) {
              setFocusedId(id)
              branchEl.focus()
            }
          }
        }

        const next = expanded.includes(id)
          ? expanded.filter((item) => item !== id)
          : [...expanded, id]
        if (!isControlledExpanded) {
          setInternalExpanded(next)
        }
        onExpandedChange?.(next)
      },
      [expanded, isControlledExpanded, onExpandedChange, focusedId]
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

    const handleTypeahead = React.useCallback(
      (char: string, currentIndex: number, visibleItems: HTMLElement[]) => {
        if (typeaheadTimerRef.current) {
          clearTimeout(typeaheadTimerRef.current)
        }
        typeaheadTimerRef.current = setTimeout(() => {
          typeaheadBufferRef.current = ''
        }, 500)

        typeaheadBufferRef.current += char
        const query = typeaheadBufferRef.current

        const searchOrder = [
          ...visibleItems.slice(currentIndex + 1),
          ...visibleItems.slice(0, currentIndex + 1),
        ]

        const match = searchOrder.find((el) => {
          const text = (
            el.getAttribute('data-text-value') ||
            el.textContent ||
            ''
          )
            .trim()
            .toLowerCase()
          return text.startsWith(query)
        })

        if (match) {
          setFocusedId(match.id)
          match.focus()
        }
      },
      []
    )

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

        const isRtl = typeof document !== 'undefined' && document.dir === 'rtl'
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

          case 'Enter':
          case ' ': {
            e.preventDefault()
            selectItem(id)
            break
          }

          default: {
            if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey && e.key !== ' ') {
              e.preventDefault()
              handleTypeahead(e.key.toLowerCase(), currentIndex, visibleItems)
            }
            break
          }
        }
      },
      [toggleExpanded, selectItem, handleTypeahead]
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
            p="1r"
            border="1px solid"
            borderColor="ui.field.border"
            borderRadius="md"
            bg="ui.field.background"
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
  Item: typeof TreeItem
  Group: typeof TreeGroup
  Expander: typeof TreeExpander
}

Tree.Item = TreeItem
Tree.Group = TreeGroup
Tree.Expander = TreeExpander
