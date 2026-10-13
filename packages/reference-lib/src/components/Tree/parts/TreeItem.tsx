/**
 * Tree's item part: one treeitem row, branch or leaf. It resolves identity
 * and branch semantics from authored structure, derives selection,
 * expansion, tab-stop, and virtual-active presentation, wires the
 * registration and interaction hooks, and renders the row — branches
 * splitting row content from group content. All commands live in the
 * hooks; this file composes them over the Div.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import { ComboboxContext } from '../../Combobox/combobox-context'
import { TreeContext, TreeItemContext, TreeLevelContext } from '../context'
import { useComposedRefs, useTreeItemInteraction, useTreeItemRegistration } from '../hooks'
import type { TreeItemProps } from '../types'
import { TreeGroup } from './TreeGroup'

function isGroupChild(child: React.ReactNode): boolean {
  return (
    React.isValidElement(child) &&
    (child.type === TreeGroup ||
      (child.type as any)?.displayName === 'TreeGroup' ||
      (child.props as any)?.role === 'group' ||
      (child.props as any)?.['data-testid']?.includes('group'))
  )
}

export const TreeItem: React.ForwardRefExoticComponent<
  TreeItemProps & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, TreeItemProps>(
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
      onPointerDown,
      onMouseDown,
      onPointerMove,
      className,
      style,
      ...props
    },
    ref
  ) {
    const generatedId = React.useId()
    const id = (valueProp ?? idProp ?? generatedId) as string
    const tree = React.useContext(TreeContext)
    const combobox = React.useContext(ComboboxContext)
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
    // TR-CB-01: inside Combobox the source owns DOM focus, so nested items
    // keep no tab stop; standalone roving is unchanged.
    const tabIndex = combobox ? -1 : isDisabled ? -1 : isCurrentFocus ? 0 : -1
    // TR-CB-06: inside Combobox, data-active previews the source's virtual
    // focus (Listbox active-derivation parity); standalone keeps focus.
    const isVirtualActive = combobox
      ? combobox.activeOptionId === id ||
        (combobox.activeValue === id &&
          (!combobox.activeOptionId || combobox.activeOptionId === id))
      : false
    const showActive = combobox ? isVirtualActive : isCurrentFocus

    const itemRef = React.useRef<HTMLDivElement | null>(null)
    const composedRef = useComposedRefs(ref, itemRef)

    useTreeItemRegistration({
      tree,
      combobox,
      id,
      isBranch,
      isDisabled,
      textValue,
      children,
      itemRef,
    })

    const {
      handleClick,
      handleFocus,
      handlePointerDown,
      handleMouseDown,
      handlePointerMove,
      handleKeyDown,
    } = useTreeItemInteraction({
      tree,
      combobox,
      id,
      isBranch,
      isExpanded,
      isDisabled,
      itemRef,
      onClick,
      onKeyDown,
      onFocus,
      onPointerDown,
      onMouseDown,
      onPointerMove,
    })

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
            data-active={showActive ? '' : undefined}
            data-text-value={textValue}
            onClick={handleClick}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            onPointerDown={handlePointerDown}
            onMouseDown={handleMouseDown}
            onPointerMove={handlePointerMove}
            display="flex"
            flexDirection="column"
            outline="none"
            userSelect="none"
            cursor={isDisabled ? 'not-allowed' : 'pointer'}
            css={{
              '&:focus-visible > [data-slot="row"]': {
                outline: '2px solid',
                outlineColor: 'ui.focus.ring',
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
          data-active={showActive ? '' : undefined}
          data-text-value={textValue}
          onClick={handleClick}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onMouseDown={handleMouseDown}
          onPointerMove={handlePointerMove}
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
