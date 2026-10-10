/** Single-element anatomy gate for the RovingFocus kernel (RF-DOM-06,
 * FEATURES #3). `assertSingleElementChild` throws a descriptive render-time
 * error unless Root or Item received exactly one element child — omitted,
 * null, boolean, text, number, Fragment, and multi-element shapes each get
 * their own message. Parts call it after hooks so a throw unmounts the tree
 * with no partial registration. */

import * as React from 'react'

export function assertSingleElementChild(
  children: React.ReactNode,
  part: 'Root' | 'Item'
): asserts children is React.ReactElement {
  // Nullish and booleans normalize to a zero count before measuring:
  // Children.count(false) is 1 (booleans traverse as render-nothing nodes),
  // but false/null/undefined all mean "no element was authored".
  const count =
    children === null || children === undefined || typeof children === 'boolean'
      ? 0
      : React.Children.count(children)
  if (count === 0) {
    throw new Error(
      `Reference UI: RovingFocus.${part} expects exactly one element child, but received none (children omitted, null, or false). Render a single element so the kernel has a node to augment.`
    )
  }
  if (count > 1) {
    throw new Error(
      `Reference UI: RovingFocus.${part} expects exactly one element child, but received ${count} children. Wrap them in a single element.`
    )
  }
  // toArray (not Children.only, which throws its own invariant for non-element
  // singles) — validation-only, never rendered.
  const [child] = React.Children.toArray(children)
  if (typeof child !== 'object' || child === null || !React.isValidElement(child)) {
    const received =
      typeof child === 'string' ? 'text' : typeof child === 'number' ? 'a number' : typeof child
    throw new Error(
      `Reference UI: RovingFocus.${part} expects exactly one element child, but received ${received}. Render a single element so the kernel has a node to augment.`
    )
  }
  if (child.type === React.Fragment) {
    throw new Error(
      `Reference UI: RovingFocus.${part} expects exactly one element child, but received a Fragment. Fragments render no node for tabIndex/ref augmentation — render a single element instead.`
    )
  }
}
