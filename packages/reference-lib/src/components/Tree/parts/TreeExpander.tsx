/**
 * Tree's expander part: the chevron button that toggles its item's
 * branch. Controlled when `expanded` is passed, context-driven
 * otherwise; a disabled branch never requests expansion (TR-EXPAND-09),
 * and inside Combobox the press never moves DOM focus off the source
 * (TR-CB-01). One presentational control — expansion state lives in the
 * root's expansion hook.
 */
import * as React from 'react'
import { Button } from '@reference-ui/react'
import { ComboboxContext } from '../../Combobox/combobox-context'
import { TreeContext, TreeItemContext } from '../context'
import type { TreeExpanderProps } from '../types'

export const TreeExpander: React.ForwardRefExoticComponent<
  TreeExpanderProps & React.RefAttributes<HTMLButtonElement>
> = React.forwardRef<HTMLButtonElement, TreeExpanderProps>(
  function TreeExpander(
    {
      expanded: expandedProp,
      onToggle,
      itemId: itemIdProp,
      children,
      className,
      style,
      onClick,
      onPointerDown,
      onMouseDown,
      ...props
    },
    ref
  ) {
    const tree = React.useContext(TreeContext)
    const combobox = React.useContext(ComboboxContext)
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

    // TR-CB-01: inside Combobox, Expander press never moves DOM focus off
    // the source — a mousedown default here would blur the input and
    // dismiss the popover before click expands.
    const handleExpanderPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
      onPointerDown?.(e)
      if (combobox && !e.defaultPrevented) {
        e.preventDefault()
      }
    }

    const handleExpanderMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
      onMouseDown?.(e)
      if (combobox && !e.defaultPrevented) {
        e.preventDefault()
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
        onPointerDown={handleExpanderPointerDown}
        onMouseDown={handleExpanderMouseDown}
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
