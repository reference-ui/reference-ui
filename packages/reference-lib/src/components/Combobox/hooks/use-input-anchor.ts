/**
 * Combobox Input anchoring: the Field-aware anchor write (the Field node
 * when nested, else the input itself) into the combobox source ref and
 * the Overlay trigger ref, the composed consumer ref, the every-commit
 * anchor refresh, and focus-source registration as the editable source.
 */
import * as React from 'react'

export interface InputAnchor {
  inputRef: React.MutableRefObject<HTMLInputElement | null>
  composedRef: (node: HTMLInputElement | null) => void
}

export function useInputAnchor(
  sourceRef: React.MutableRefObject<HTMLElement | null> | undefined,
  overlay: { triggerRef: React.MutableRefObject<HTMLElement | null> } | null,
  registerFocusSource: ((type: 'input' | 'trigger') => () => void) | undefined,
  userRef: React.ForwardedRef<HTMLInputElement>
): InputAnchor {
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  const assignAnchor = React.useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node
      const host = (node?.closest('[data-reference-field]') as HTMLElement | null) ?? node
      if (sourceRef) sourceRef.current = host
      if (overlay) overlay.triggerRef.current = host
    },
    [overlay, sourceRef]
  )

  const composedRef = React.useCallback(
    (node: HTMLInputElement | null) => {
      assignAnchor(node)
      if (typeof userRef === 'function') {
        userRef(node)
      } else if (userRef && 'current' in userRef) {
        ;(userRef as React.MutableRefObject<HTMLInputElement | null>).current = node
      }
    },
    [assignAnchor, userRef]
  )

  React.useLayoutEffect(() => {
    assignAnchor(inputRef.current)
  })

  React.useLayoutEffect(() => {
    if (registerFocusSource) return registerFocusSource('input')
  }, [registerFocusSource])

  return { inputRef, composedRef }
}
