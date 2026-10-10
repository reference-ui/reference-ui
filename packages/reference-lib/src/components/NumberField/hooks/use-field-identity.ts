/**
 * useFieldIdentity: the shared Input identity plus the environment
 * diagnostics keyed to it. An explicit Input id wins for the shared
 * inputId so steppers retarget in the same commit, else a pinned
 * generated id. The pre-commit SSR capture runs on first render while
 * the DOM still holds server HTML; the mount effect validates node
 * identity and reports ICU mismatches once; generated-id collisions
 * across independent roots diagnose instead of promising uniqueness.
 */
import * as React from 'react'
import { isNumberFieldPart } from '../shared/anatomy'
import { numberFieldDevDiagnostic } from '../shared/dev'
import { useIsomorphicLayoutEffect } from '../shared/dom'
import type { EditSession } from './use-edit-session'

export interface FieldIdentityOptions {
  effectiveChildren: React.ReactNode
  groupPart: unknown
  inputPart: unknown
  session: EditSession
  inputRef: React.RefObject<HTMLInputElement | null>
  displayValue: string
  draft: string | null
}

// Explicit Input id wins for the shared inputId (NF-DOM-07): the root
// scans the direct Group for the direct Input and reads its id prop, so
// steppers retarget in the same commit. Anything else falls back to the
// generated id.
function directInputId(
  children: React.ReactNode,
  groupPart: unknown,
  inputPart: unknown,
  fallback: string
): { inputId: string; explicit: boolean } {
  for (const child of React.Children.toArray(children)) {
    if (!isNumberFieldPart(child, groupPart)) continue
    const groupKids = React.Children.toArray((child.props.children ?? null) as React.ReactNode)
    for (const grandchild of groupKids) {
      if (isNumberFieldPart(grandchild, inputPart)) {
        const id = grandchild.props.id
        if (typeof id === 'string' && id !== '') return { inputId: id, explicit: true }
        return { inputId: fallback, explicit: false }
      }
    }
  }
  return { inputId: fallback, explicit: false }
}

export function useFieldIdentity(options: FieldIdentityOptions): { inputId: string } {
  const { effectiveChildren, groupPart, inputPart, session, inputRef, displayValue, draft } = options
  const { icuCaptureRef, icuCaptureDoneRef } = session

  // Stable generated Input id (NF-DOM-07, NF-ENV-03): pinned across
  // renders (the React 17 CT shim mints a fresh useId per render —
  // Splitter/Collapsible precedent), unique within the React root.
  const rawGeneratedId = React.useId().replace(/:/g, '')
  const pinnedGeneratedIdRef = React.useRef<string | null>(null)
  if (pinnedGeneratedIdRef.current === null) {
    pinnedGeneratedIdRef.current = rawGeneratedId
  }
  const { inputId, explicit: explicitInputId } = directInputId(
    effectiveChildren,
    groupPart,
    inputPart,
    `nf-${pinnedGeneratedIdRef.current}`
  )

  // NF-ENV-02: first render runs pre-commit, while the DOM still holds
  // server HTML under hydration (or nothing under a client render) —
  // the only moment the SSR text is observable. A pure read; the mount
  // effect validates node identity (cross-root id twins are rejected).
  if (!icuCaptureDoneRef.current && typeof document !== 'undefined') {
    icuCaptureDoneRef.current = true
    try {
      const candidate = document.getElementById(inputId)
      if (
        typeof HTMLInputElement !== 'undefined' &&
        candidate instanceof HTMLInputElement
      ) {
        const attr = candidate.getAttribute('value')
        if (attr !== null) icuCaptureRef.current = { node: candidate, text: attr }
      }
    } catch {
      // ignore if not supported
    }
  }

  // Root anatomy validation (NF-DOM-03, render phase): exactly one direct
  // Group. Anything else throws a part-specific diagnostic before any
  // listener, timer, hidden host, or callback exists.
  const groupCount = React.Children.toArray(effectiveChildren).filter(child =>
    isNumberFieldPart(child, groupPart)
  ).length
  if (groupCount === 0) {
    throw new Error(
      'Reference UI: NumberField requires exactly one direct <NumberField.Group> wrapping its parts — none was found.'
    )
  }
  if (groupCount > 1) {
    throw new Error(
      `Reference UI: NumberField requires exactly one direct <NumberField.Group> but found ${groupCount} — no DOM-order authority is chosen.`
    )
  }

  // Independent SSR roots without distinct identifierPrefix values (or
  // explicit Input ids) can mint colliding generated ids: diagnose the
  // unsupported deployment instead of promising global uniqueness
  // (NF-ENV-04). The count is per owner root (NF-ENV-06): shadow-scoped
  // ids collide only within their own root, never the document.
  useIsomorphicLayoutEffect(() => {
    if (explicitInputId || typeof document === 'undefined') return
    let matches = 0
    try {
      const root =
        (inputRef.current?.getRootNode() as Document | ShadowRoot | undefined) ?? document
      matches = root.querySelectorAll(`[id="${inputId}"]`).length
    } catch {
      return
    }
    if (matches > 1) {
      numberFieldDevDiagnostic(
        `generated Input id "${inputId}" collides across independent roots — use distinct identifierPrefix values or explicit Input ids.`
      )
    }
  }, [inputId, explicitInputId, inputRef])

  // NF-ENV-02: server/client Intl/CLDR/ICU mismatch is an unsupported
  // deployment — reported once through the dev channel, never thrown,
  // and never a promise that arbitrary ICU versions produce equal
  // bytes. The SSR text is captured during first render (pre-commit
  // DOM read keyed by the deterministic inputId — post-commit React
  // has already patched the node); the mount effect compares only
  // when hydration adopted that exact node. Pure client renders and
  // byte-identical hydrates stay silent; later text changes are user
  // edits, never deployment evidence.
  const icuMismatchLoggedRef = React.useRef(false)
  useIsomorphicLayoutEffect(() => {
    if (icuMismatchLoggedRef.current) return
    const capture = icuCaptureRef.current
    icuCaptureRef.current = null
    if (!capture || capture.node !== inputRef.current) return
    if (capture.text === displayValue) return
    icuMismatchLoggedRef.current = true
    numberFieldDevDiagnostic(
      `server-rendered text ${JSON.stringify(capture.text)} does not match the client Intl format ` +
        `${JSON.stringify(displayValue)} — the server and client Intl/CLDR/ICU data differ, ` +
        `which is an unsupported deployment; arbitrary ICU versions are not promised identical bytes.`
    )
  }, [displayValue, draft, icuCaptureRef, inputRef])

  return { inputId }
}
