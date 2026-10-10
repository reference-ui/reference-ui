/**
 * Switch's checked state in both modes: controlled when checked is defined,
 * uncontrolled from defaultChecked otherwise. Returns the resolved checked
 * value, the mode flag the click handler gates on, and an acceptor that
 * stores the next value only in uncontrolled mode — controlled callers own
 * their own state and just hear about the request through onChange.
 */
import * as React from 'react'

interface CheckedStateOptions {
  checked?: boolean
  defaultChecked?: boolean
}

export function useCheckedState({ checked: checkedProp, defaultChecked = false }: CheckedStateOptions) {
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked)
  const isControlled = checkedProp !== undefined
  const checked = isControlled ? checkedProp : internalChecked

  const acceptChecked = React.useCallback(
    (nextChecked: boolean) => {
      if (!isControlled) {
        setInternalChecked(nextChecked)
      }
    },
    [isControlled]
  )

  return { checked, isControlled, acceptChecked }
}
