// @ts-nocheck — CJS React 17 has no types at this pin path.
import * as React from './node_modules/react/index.js'

let count = 0

export function useId() {
  return `:ct${++count}:`
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
