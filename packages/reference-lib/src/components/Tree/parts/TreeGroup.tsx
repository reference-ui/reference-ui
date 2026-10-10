/**
 * Tree's group part: the collapsible child container of a branch item. It
 * renders only while its parent branch is expanded, bumps the level
 * scope for its items, and keeps sibling metadata current through a
 * child-list observer. Presentational scoping only — expansion state
 * lives in the root's expansion hook.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import { TreeContext, TreeItemContext, TreeLevelContext } from '../context'
import { useComposedRefs } from '../hooks'
import { updateContainerTreeitemPositions } from '../siblings/positions'
import type { TreeGroupProps } from '../types'

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
