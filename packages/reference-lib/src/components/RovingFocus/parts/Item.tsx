/** RovingFocus.Item: the transparent item part. Slots kernel behavior onto
 * its single authored child — authoritative tabIndex (0 for the current
 * item, -1 otherwise), registration into the root's collection, and the
 * kernel focus/keydown/pointer handlers chained last behind child and part
 * handlers. Focus and pointer presses both confer currentness so Tab
 * re-entry lands on the last-touched item; pointer handling is
 * currentness-only and never steals focus. */

import * as React from 'react'
import { RovingFocusContext } from '../context'
import { chainSlotRefs, getChildRef } from '../shared/refs'
import { nextRovingFocusItemId } from '../shared/ids'
import { ITEM_EXCLUDED_PROPS, mergeSlotProps, type AnyProps } from '../slot/merge'
import { assertSingleElementChild } from '../slot/anatomy'
import type { RovingFocusItemProps } from '../types'

export const RovingFocusItem = React.forwardRef<HTMLElement, RovingFocusItemProps>(
  function RovingFocusItem(props, forwardedRef) {
    const { children, id: idProp, disabled = false, textValue, getNode } = props
    const context = React.useContext(RovingFocusContext)
    if (!context) {
      throw new Error('Reference UI: RovingFocus.Item must be used within a RovingFocus.Root')
    }

    const generatedIdRef = React.useRef<string | null>(null)
    if (!generatedIdRef.current) {
      generatedIdRef.current = nextRovingFocusItemId()
    }
    const id = idProp ?? generatedIdRef.current

    const itemRef = React.useRef<HTMLElement | null>(null)

    React.useEffect(() => {
      return context.registerItem({
        id,
        ref: itemRef,
        disabled,
        textValue,
        getNode,
      })
    }, [context, id, disabled, textValue, getNode])

    assertSingleElementChild(children, 'Item')

    const child = children as React.ReactElement

    // Before the client settles a current id (and during SSR), the first enabled
    // item to render claims the sole tab stop so server and client agree.
    let isCurrent = false
    if (context.currentId !== null) {
      isCurrent = context.currentId === id
    } else if (!disabled) {
      isCurrent = context.claimInitialActiveId(id)
    }
    // Authoritative: consumer tabIndex values on part or child never win (RF-TAB-08).
    const tabIndex = isCurrent && !disabled ? 0 : -1

    // Kernel handlers run last in the slot chain (child, then part consumer
    // props, then kernel), each gated on defaultPrevented (RF-KEY-08).
    const handleKernelFocus = () => {
      if (!disabled && context.currentId !== id) {
        context.setCurrentId(id)
      }
    }

    const handleKernelKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
      context.onItemKeyDown(e, id)
    }

    // Pointer press sets currentness (RF-TAB-04): taps that never
    // move DOM focus (touch, Safari click) still choose the re-entry stop.
    // Currentness-only — never focuses, so composed focus policies (Menu
    // click-open restore) keep full authority. Consumer preventDefault opts out.
    // Primary button only: right-clicks and aux presses must not move the stop
    // (UX review); the consumer's own handler still sees every press.
    const handleKernelPointerDown = (e: React.PointerEvent<HTMLElement>) => {
      if (e.defaultPrevented || e.button !== 0) return
      if (!disabled && context.currentId !== id) {
        context.setCurrentId(id)
      }
    }

    const merged = mergeSlotProps({
      partProps: props as unknown as AnyProps,
      child,
      exclude: ITEM_EXCLUDED_PROPS,
      kernelHandlers: {
        onFocus: handleKernelFocus,
        onKeyDown: handleKernelKeyDown,
        onPointerDown: handleKernelPointerDown,
      },
      overrides: { tabIndex },
    })

    return React.cloneElement(child, {
      ...merged,
      ref: chainSlotRefs(
        (node: HTMLElement | null) => {
          itemRef.current = node
        },
        getChildRef(child),
        forwardedRef
      ),
    } as unknown as Record<string, unknown>)
  }
)

RovingFocusItem.displayName = 'RovingFocus.Item'
