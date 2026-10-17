/**
 * useStepperName: the required-name gate. A present
 * labelledby overrides aria-label per platform semantics, so it must
 * resolve to a nonempty name even when a label is also authored.
 * Labelledby targets only exist in committed DOM, so verification runs
 * in a layout effect: the first paint assumes named (SSR-safe) and an
 * unresolved name hides pre-paint. Missing, empty, or unresolved naming
 * fails with a descriptive dev diagnostic; the offender renders nothing
 * and so neither registers nor activates.
 */
import * as React from 'react'
import { numberFieldDevDiagnostic } from '../shared/dev'
import { useIsomorphicLayoutEffect } from '../shared/dom'
import { stepperNameIds, stepperNameText } from '../shared/names'

// Runtime: missing, empty, or unresolved stepper naming fails
// with a descriptive dev diagnostic; the offender renders nothing and so
// neither registers nor activates (no registration system exists until §4).
// Labelledby targets only exist in committed DOM, so verification runs in a
// layout effect: the first paint assumes named (SSR/hydration-safe) and an
// unresolved name hides pre-paint. Targets must be committed with the
// stepper — a later-mounting target with unchanged props does not re-verify.
// Effective-name semantics follow the
// platform: a present labelledby overrides aria-label, so it must resolve
// to a nonempty name even when a label is also authored.
export function useStepperName(
  kind: 'Increment' | 'Decrement',
  ariaLabel: unknown,
  ariaLabelledby: unknown,
  buttonRef?: React.RefObject<HTMLButtonElement | null>
): boolean {
  const labelValid = stepperNameText(ariaLabel).trim() !== ''
  const labelledbyText = stepperNameText(ariaLabelledby)
  const usesLabelledby = stepperNameIds(labelledbyText).length > 0
  const [labelledbyValid, setLabelledbyValid] = React.useState<boolean | null>(null)
  const loggedRef = React.useRef(false)

  useIsomorphicLayoutEffect(() => {
    if (!usesLabelledby || typeof document === 'undefined') return
    const ids = stepperNameIds(labelledbyText)
    // NF-ENV-06: labelledby targets resolve in the stepper's owner root
    // (open ShadowRoot included) — never document-global.
    const root =
      (buttonRef?.current?.getRootNode() as Document | ShadowRoot | undefined) ?? document
    const elements = ids.map(id => root.getElementById(id))
    const name = elements
      .map(el => (el === null ? '' : el.getAttribute('aria-label') || el.textContent || ''))
      .join(' ')
    setLabelledbyValid(elements.every(el => el !== null) && name.trim() !== '')
  }, [usesLabelledby, labelledbyText, buttonRef])

  let named = true
  let reason = ''
  if (usesLabelledby) {
    if (labelledbyValid === false) {
      named = false
      reason =
        `${kind} has an "aria-labelledby" that does not resolve to a nonempty accessible name ` +
        `("${labelledbyText}") — the stepper was not rendered and will not activate.`
    }
  } else if (!labelValid) {
    named = false
    reason =
      `${kind} requires a nonempty authored "aria-label" or a resolving "aria-labelledby" — ` +
      `no English fallback exists, so the stepper was not rendered and will not activate.`
  }

  useIsomorphicLayoutEffect(() => {
    if (named || loggedRef.current) return
    loggedRef.current = true
    numberFieldDevDiagnostic(reason)
  }, [named, reason])

  return named
}
