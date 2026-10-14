/**
 * Tree's root: the tree container and compound assembly. It enforces the
 * fully-controlled contract (standalone value/onChange required,
 * nested onChange diagnosed and ignored), composes the session,
 * expansion, selection, focus, and keyboard hooks, provides the item
 * scope, and renders the container Div. All decisions live in the hooks
 * and domain folders; this file ends in the public compound assignment
 * (Root, Item, Group, Expander) and keeps the expansion helpers'
 * historical export path for tests.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import { ComboboxContext } from '../Combobox/combobox-context'
import { TreeContext, TreeLevelContext } from './context'
import {
  useTreeDiagnostics,
  useTreeExpansion,
  useTreeFocus,
  useTreeKeyboard,
  useTreeSelection,
  useTreeSession,
} from './hooks'
import { TreeExpander } from './parts/TreeExpander'
import { TreeGroup } from './parts/TreeGroup'
import { TreeItem } from './parts/TreeItem'
import { treeDiagnostic } from './shared/diagnostic'
import type { TreeContextValue, TreeProps } from './types'

export { getBatchExpanded, getDeterministicExpanded } from './expansion/deterministic'

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
    const combobox = React.useContext(ComboboxContext)

    // Fully controlled selection standalone: value is required (null is the
    // empty value) and onChange is required — a callback-less tree would
    // freeze silently. Inside Combobox both are optional: selection display
    // falls back to the root value and commits route to the root (TR-CB-04).
    // Render-phase pure checks: StrictMode-safe.
    if (value === undefined && !combobox) {
      throw new Error(
        'Reference UI: Tree "value" is required — the tree is fully controlled, with null as the empty value.'
      )
    }
    if (onChange === undefined && !combobox) {
      throw new Error(
        'Reference UI: Tree "onChange" is required — the tree is fully controlled; pass a handler that writes selection state back.'
      )
    }

    // TR-CB-04: a nested onChange diagnoses (render-time, matching the
    // Combobox authored-scan diagnostic) and is never invoked — activation
    // commits only through root onChange, never double-updates.
    if (combobox && onChange !== undefined) {
      treeDiagnostic(
        'Tree owns expansion, not commits, inside Combobox: a nested onChange is ignored. Remove it; root onChange is the sole commit callback.'
      )
    }

    const effectiveValue = combobox ? (value ?? combobox.value) : value

    const session = useTreeSession(expandedProp, defaultExpanded)
    const { isItemExpanded, toggleExpanded, expandItems, registerBranchOrder } = useTreeExpansion(
      session,
      combobox,
      onExpandedChange
    )
    const { isItemSelected, selectItem } = useTreeSelection(effectiveValue, value, combobox, onChange)
    useTreeFocus(session, combobox, effectiveValue)
    // Dev diagnostics for unmatched ids. Inside Combobox the value belongs to
    // the source, so only the standalone value is checked; expanded still is.
    useTreeDiagnostics(session, combobox ? undefined : value)
    const handleItemKeyDown = useTreeKeyboard(session, toggleExpanded, expandItems, selectItem)
    const { focusedId, setFocusedId, expanded, registerItemInstance, rootRef } = session

    const contextValue = React.useMemo<TreeContextValue>(
      () => ({
        value: effectiveValue ?? null,
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
        effectiveValue,
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
