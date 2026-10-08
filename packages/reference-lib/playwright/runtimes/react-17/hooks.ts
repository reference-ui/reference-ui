// @ts-nocheck — CJS React 17 has no types at this pin path.
import * as React from './node_modules/react/index.js'

let count = 0

export function useId() {
  // Stable for the component's lifetime (React useId contract): the old
  // `:ct${++count}:`-per-render broke every id-keyed registry on r17
  // (Overlay stack layers, parentId nesting links) on each re-render.
  const [id] = React.useState(() => `:ct${++count}:`)
  return id
}

export function useSyncExternalStore<T>(
  subscribe: (onStoreChange: () => void) => () => void,
  getSnapshot: () => T,
  _getServerSnapshot?: () => T,
) {
  const [value, setValue] = React.useState(getSnapshot)
  React.useLayoutEffect(() => {
    setValue(getSnapshot())
    return subscribe(() => {
      setValue(getSnapshot())
    })
  }, [subscribe, getSnapshot])
  return value
}
