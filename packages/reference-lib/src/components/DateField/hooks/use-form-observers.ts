/**
 * Form observers shared by both field machines: every dirty field
 * observes each submit, a failed boundary blocks until a documented
 * resolution (valid edit, accepted commit, authoritative value change,
 * or unprevented reset), and reset reformats without changing
 * controlled ISO. `form.submit()` bypasses events and stays outside the
 * guarantee. Re-subscribed every render so the closures always see
 * current session state; the bubble-phase reset listener runs after
 * application capture vetoes (defaultPrevented = intact).
 */
import * as React from 'react'

export interface FormObserversOptions {
  getInput: () => HTMLInputElement | null
  getResetTarget: () => HTMLInputElement | null
  disabled: boolean
  readOnly: boolean
  failed: boolean
  isDirty: boolean
  onCommit: () => void
  onResetState: () => void
}

export function useFormObservers(options: FormObserversOptions) {
  const { getInput, getResetTarget, disabled, readOnly, failed, isDirty, onCommit, onResetState } =
    options
  React.useEffect(() => {
    const input = getInput()
    const form = input?.form ?? null
    if (!input || !form || disabled) return
    const onSubmit = (submitEvent: Event) => {
      if (readOnly || submitEvent.defaultPrevented) return
      if (failed) {
        submitEvent.preventDefault()
        return
      }
      if (isDirty) {
        onCommit()
        submitEvent.preventDefault()
      }
    }
    const onReset = (resetEvent: Event) => {
      if (resetEvent.defaultPrevented) return
      onResetState()
      const target = getResetTarget()
      const caretToEnd = () => {
        try {
          target?.focus()
          const end = target?.value.length ?? 0
          target?.setSelectionRange(end, end)
        } catch {
          // Non-text selection contexts (tests) ignore caret placement.
        }
      }
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(caretToEnd)
      } else {
        caretToEnd()
      }
    }
    form.addEventListener('submit', onSubmit)
    form.addEventListener('reset', onReset)
    return () => {
      form.removeEventListener('submit', onSubmit)
      form.removeEventListener('reset', onReset)
    }
  })
}
