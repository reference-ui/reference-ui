import * as React from 'react'

/**
 * Read a child's ref without tripping React's version-specific warning getters.
 *
 * React 19 moved ref into props and turned `element.ref` into a deprecated
 * accessor that logs "Accessing element.ref was removed in React 19" on read
 * (19.0/19.1 armed it for every element; 19.2+ arms it only when the element
 * carries a ref). React 18.3 added an `isReactWarning` getter on `props.ref`
 * instead, with the real ref on `element.ref`. So neither property is safe to
 * read blindly on every major — this helper inspects property descriptors
 * only and never invokes a getter. (B-03)
 */
export function getElementRef(element: React.ReactElement<any>): React.Ref<any> | undefined {
  const propsDescriptor = Object.getOwnPropertyDescriptor(element.props, 'ref')
  const elementDescriptor = Object.getOwnPropertyDescriptor(element, 'ref')
  const propsValue =
    propsDescriptor && 'value' in propsDescriptor ? propsDescriptor.value : undefined
  const elementValue =
    elementDescriptor && 'value' in elementDescriptor ? elementDescriptor.value : undefined
  // React 19 carries the ref in props; React <=18 carries it on the element.
  // Warning and deprecation accessors have no 'value', so they are skipped.
  return propsValue ?? elementValue
}
