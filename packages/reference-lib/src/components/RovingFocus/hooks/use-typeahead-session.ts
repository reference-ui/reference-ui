/** Typeahead session lifecycle for a RovingFocus root. `useTypeaheadSession`
 * owns the `TypeaheadModel` (query buffer plus its 1000ms idle timer) for
 * the composite's lifetime and resets it on unmount so a remount never
 * inherits a stale buffer. The keyboard hook feeds the model live labels
 * per keystroke; the model itself stays framework-free in typeahead/. */

import * as React from 'react'
import { TypeaheadModel } from '../typeahead/model'

export function useTypeaheadSession(): React.RefObject<TypeaheadModel> {
  const typeaheadModelRef = React.useRef<TypeaheadModel>(new TypeaheadModel())

  React.useEffect(() => {
    const model = typeaheadModelRef.current
    return () => {
      model.reset()
    }
  }, [])

  return typeaheadModelRef
}
