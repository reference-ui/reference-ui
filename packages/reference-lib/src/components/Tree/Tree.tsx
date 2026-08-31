import * as React from 'react'
import { RovingFocus } from '../RovingFocus'

export interface TreeProps
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'onChange' | 'value' | 'defaultValue'> {
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
  isItemSelected: (id: string) => boolean
  isItemExpanded: (id: string) => boolean
  selectItem: (id: string) => void
  toggleExpanded: (id: string) => void
}

const TreeContext = React.createContext<TreeContextValue | null>(null)

export interface TreeItemProps extends React.ComponentPropsWithoutRef<'div'> {
  id: string
  disabled?: boolean
  isBranch?: boolean
}

export function TreeItem({
  id,
  disabled = false,
  isBranch = false,
  children,
  onClick,
  onKeyDown,
  className,
  style,
  ...props
}: TreeItemProps) {
  const context = React.useContext(TreeContext)
  const isSelected = context ? context.isItemSelected(id) : false
  const isExpanded = context ? context.isItemExpanded(id) : false
  const isDisabled = disabled || (context?.disabled ?? false)

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    onClick?.(e)
    if (!e.defaultPrevented && !isDisabled && context) {
      context.selectItem(id)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || isDisabled || !context) return

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      context.selectItem(id)
    } else if (isBranch && e.key === 'ArrowRight' && !isExpanded) {
      e.preventDefault()
      context.toggleExpanded(id)
    } else if (isBranch && e.key === 'ArrowLeft' && isExpanded) {
      e.preventDefault()
      context.toggleExpanded(id)
    }
  }

  return (
    <RovingFocus.Item id={id} disabled={isDisabled}>
      <div
        role="treeitem"
        id={id}
        tabIndex={isDisabled ? -1 : 0}
        aria-selected={isSelected}
        aria-expanded={isBranch ? isExpanded : undefined}
        aria-disabled={isDisabled ? 'true' : undefined}
        data-state={isSelected ? 'selected' : 'unselected'}
        data-expanded={isBranch && isExpanded ? '' : undefined}
        data-disabled={isDisabled ? '' : undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={className}
        style={{
          display: 'flex',
          flexDirection: 'column',
          outline: 'none',
          userSelect: 'none',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    </RovingFocus.Item>
  )
}

export function TreeGroup({
  children,
  className,
  style,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      role="group"
      className={className}
      style={{
        paddingLeft: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

export function TreeExpander({
  itemId,
  children,
  className,
  style,
  onClick,
  ...props
}: React.ComponentPropsWithoutRef<'button'> & { itemId: string }) {
  const context = React.useContext(TreeContext)
  const isExpanded = context?.isItemExpanded(itemId)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    onClick?.(e)
    if (!e.defaultPrevented) {
      context?.toggleExpanded(itemId)
    }
  }

  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={isExpanded ? 'Collapse' : 'Expand'}
      onClick={handleClick}
      className={className}
      style={{
        border: 'none',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        padding: '0 4px',
        fontSize: 12,
        ...style,
      }}
      {...props}
    >
      {children ?? (isExpanded ? '▼' : '▶')}
    </button>
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
        const next = expanded.includes(id)
          ? expanded.filter((item) => item !== id)
          : [...expanded, id]
        if (!isControlledExpanded) {
          setInternalExpanded(next)
        }
        onExpandedChange?.(next)
      },
      [expanded, isControlledExpanded, onExpandedChange]
    )

    const contextValue = React.useMemo<TreeContextValue>(
      () => ({
        value,
        expanded,
        disabled,
        isItemSelected,
        isItemExpanded,
        selectItem,
        toggleExpanded,
      }),
      [value, expanded, disabled, isItemSelected, isItemExpanded, selectItem, toggleExpanded]
    )

    return (
      <TreeContext.Provider value={contextValue}>
        <RovingFocus.Root orientation="vertical" loop>
          <div
            ref={ref}
            role="tree"
            data-reference-tree=""
            data-disabled={disabled ? '' : undefined}
            className={className}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              padding: 4,
              border: '1px solid #e5e7eb',
              borderRadius: 6,
              outline: 'none',
              ...style,
            }}
            {...props}
          >
            {children}
          </div>
        </RovingFocus.Root>
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
