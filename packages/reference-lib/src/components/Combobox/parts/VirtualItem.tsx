/**
 * Combobox's transparent grid cell (#5, CB-ADAPTER-04/05/06). Slots the
 * logical item's stable value-derived ID, disabled/selected/active
 * state, ref, and events onto exactly one native child. Consumer child
 * handlers run before Combobox defaults; `preventDefault()` cancels
 * preview and commit independently. Invalid shapes (no adapter, bad
 * index, zero/multiple/fragment/non-ref-capable child) diagnose in dev
 * and render unwired — they can never become active or commit.
 */
import * as React from 'react'
import { ComboboxContext } from '../combobox-context'
import { comboboxDiagnostic } from '../shared/diagnostic'
import { sanitizeIdSegment } from '../shared/ids'
import type { ComboboxVirtualItemProps } from '../types'

export const ComboboxVirtualItem = React.forwardRef<HTMLElement, ComboboxVirtualItemProps>(
  function ComboboxVirtualItem(
    { index, children, className, style }: ComboboxVirtualItemProps,
    userRef
  ) {
    const context = React.useContext(ComboboxContext)
    const nodeRef = React.useRef<HTMLElement | null>(null)

    const adapter = context?.virtualAdapter ?? null
    const item = adapter && Number.isInteger(index) ? adapter.items[index] : undefined
    const value = item?.value ?? null
    const id =
      value != null && context ? `${context.popoverId}-virt-${sanitizeIdSegment(value)}` : null
    const disabled = item?.disabled ?? false

    const childCount = React.Children.count(children)
    const child =
      childCount === 1 && React.isValidElement(children) ? children : null
    const childType = (child?.type ?? null) as React.ElementType | null
    const isInvalidShape =
      adapter == null ||
      item == null ||
      child == null ||
      childType === React.Fragment

    if (isInvalidShape) {
      if (adapter == null) {
        comboboxDiagnostic(
          `Combobox.VirtualItem index ${index} requires an effective Popover virtualFocus adapter (none authored, or the authored one is conflicted/invalid). Rendered unwired; it cannot become active.`
        )
      } else if (item == null) {
        comboboxDiagnostic(
          `Combobox.VirtualItem index ${index} is out of range (0..${adapter.items.length - 1}). Rendered unwired; it cannot become active.`
        )
      } else {
        comboboxDiagnostic(
          'Combobox.VirtualItem requires exactly one native child element (no fragment, no zero/multiple children). Rendered unwired; it cannot become active.'
        )
      }
    }

    const childProps = (child?.props ?? {}) as Record<string, unknown>
    const childRef = (child as { ref?: React.Ref<HTMLElement> } | null)?.ref

    // Stable identity: a fresh callback each render would detach and
    // re-attach the child ref every commit, looping when the consumer
    // ref callback sets state. Above the early return (hook order).
    const composedRef = React.useCallback(
      (node: HTMLElement | null) => {
        nodeRef.current = node
        if (typeof childRef === 'function') {
          childRef(node)
        } else if (childRef && typeof childRef === 'object') {
          ;(childRef as React.MutableRefObject<HTMLElement | null>).current = node
        }
        if (typeof userRef === 'function') {
          userRef(node)
        } else if (userRef && typeof userRef === 'object') {
          ;(userRef as React.MutableRefObject<HTMLElement | null>).current = node
        }
      },
      [childRef, userRef]
    )

    const registerVirtualItem = context?.registerVirtualItem
    React.useLayoutEffect(() => {
      if (isInvalidShape || !registerVirtualItem || value == null || id == null) return
      const node = nodeRef.current
      if (node == null) {
        comboboxDiagnostic(
          `Combobox.VirtualItem index ${index} child is not ref-capable (no host node resolved). It cannot become active.`
        )
        return
      }
      return registerVirtualItem({ index, value, id, node, disabled })
    }, [isInvalidShape, registerVirtualItem, value, id, index, disabled])

    if (!context || isInvalidShape || child == null || id == null || value == null) {
      return <>{children}</>
    }

    const isActive = context.activeValue === value && context.activeOptionId === id
    const isSelected = context.value === value

    const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
      ;(childProps.onPointerMove as ((e: React.PointerEvent<HTMLElement>) => void) | undefined)?.(e)
      if (e.defaultPrevented || e.pointerType === 'touch' || disabled) return
      context.previewVirtualItem(index)
    }
    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
      ;(childProps.onClick as ((e: React.MouseEvent<HTMLElement>) => void) | undefined)?.(e)
      if (e.defaultPrevented || disabled) return
      context.commitVirtualItem(index)
    }

    const childClassName = childProps.className as string | undefined
    const childStyle = childProps.style as React.CSSProperties | undefined

    return React.cloneElement(child, {
      id,
      ref: composedRef,
      onPointerMove: handlePointerMove,
      onClick: handleClick,
      'aria-disabled': disabled || undefined,
      'data-disabled': disabled ? '' : undefined,
      'aria-selected': isSelected || undefined,
      'data-selected': isSelected ? '' : undefined,
      'data-active': isActive ? '' : undefined,
      className: [childClassName, className].filter(Boolean).join(' ') || undefined,
      style: { ...childStyle, ...style },
    } as Record<string, unknown>)
  }
)
