import * as React from 'react'
import type { PresenceProps } from './types'
import { PresenceContext } from './context'
import { usePresence } from './hooks/use-presence'
import { useStableComposedRefs } from './hooks/use-stable-composed-refs'
import { getElementRef } from './shared/element-ref'

/**
 * Transparent exit-lifecycle wrapper: renders the authored child untouched
 * while `present`, and keeps it mounted through its closing effects once
 * `present` flips false. This file is composition only — child-shape
 * validation, the `usePresence` lifecycle, and the composed observer ref —
 * and re-exports `usePresence` for headless consumers such as Toast. The
 * state machine lives in `hooks/use-presence`, effect detection in `exit/`,
 * nesting in `nesting/`, and sibling coordination in `coordination/`.
 */

export { usePresence } from './hooks/use-presence'

function isEmptyChild(children: PresenceProps['children']): boolean {
  return (
    children === null ||
    children === false ||
    children === undefined ||
    (React.isValidElement(children) &&
      children.type === React.Fragment &&
      (!(children.props as any)?.children ||
        React.Children.count((children.props as any).children) === 0))
  )
}

function assertSingleElementChild(children: PresenceProps['children']): void {
  // PR-DOM-06: Reject text or non-element children early if nonempty
  if (children !== null && children !== false && children !== undefined) {
    if (React.isValidElement(children) && children.type === React.Fragment) {
      const fragChildren = (children.props as any)?.children
      if (!fragChildren || React.Children.count(fragChildren) === 0) {
        // Empty fragment is treated as falsy/empty child
      } else {
        throw new Error(
          'Reference UI: Presence expects a single valid React element child.'
        )
      }
    } else if (typeof children !== 'object' || !React.isValidElement(children)) {
      throw new Error(
        'Reference UI: Presence expects a single valid React element child.'
      )
    }
  }
}

export function Presence({ children, present, onExitComplete }: PresenceProps) {
  assertSingleElementChild(children)
  const isChildEmpty = isEmptyChild(children)

  const { isPresent, ref, contextValue } = usePresence(present, {
    hasChild: !isChildEmpty,
    onExitComplete,
  })

  const child =
    React.isValidElement(children) && children.type !== React.Fragment
      ? (children as React.ReactElement<any>)
      : null
  const originalRef = child ? getElementRef(child) : undefined
  const composedRef = useStableComposedRefs(ref, originalRef)

  if (!isPresent || !child) {
    return null
  }

  return (
    <PresenceContext.Provider value={contextValue}>
      {React.cloneElement(child, {
        ref: composedRef,
      })}
    </PresenceContext.Provider>
  )
}
