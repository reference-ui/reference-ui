import type * as React from 'react'

export function assignRef<T>(ref: React.Ref<T> | undefined, node: T): void {
  if (typeof ref === 'function') {
    ref(node)
  } else if (ref && typeof ref === 'object') {
    ;(ref as React.MutableRefObject<T>).current = node
  }
}
