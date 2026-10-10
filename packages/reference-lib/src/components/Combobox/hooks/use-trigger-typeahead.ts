/**
 * Combobox Trigger typeahead session (#8, Downshift useSelect parity):
 * one 500ms shared-model session over the enabled options, reset on
 * unmount so a remounted trigger never inherits a stale buffer. The
 * keyboard hook searches it; this hook only owns its lifecycle.
 */
import * as React from 'react'
import { TypeaheadModel } from '../../RovingFocus/typeahead'

export function useTriggerTypeahead(): React.MutableRefObject<TypeaheadModel | null> {
  // #8: select-only typeahead buffer (Downshift useSelect parity: 500ms).
  const typeaheadRef = React.useRef<TypeaheadModel | null>(null)
  if (typeaheadRef.current === null) {
    typeaheadRef.current = new TypeaheadModel({ timeoutMs: 500 })
  }

  React.useEffect(() => {
    const model = typeaheadRef.current
    return () => model?.reset()
  }, [])

  return typeaheadRef
}
