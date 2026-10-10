/**
 * Toast store hook: binds the host to its document's record store for
 * the host's lifetime. Publishes the host's defaults, registers the
 * document for ambient API routing, and re-renders on every store
 * notification. Returns null during SSR before any document exists.
 */
import * as React from 'react'
import {
  getToastStore,
  setToastDefaults,
  type ToastRuntimeStore,
} from '../state/store'
import { registerToastDocument, unregisterToastDocument } from '../state/documents'

export function useToastStore({
  defaultDuration,
  defaultPosition,
  limit,
}: {
  defaultDuration: number | false
  defaultPosition: string
  limit: number
}): ToastRuntimeStore | null {
  const [, forceUpdate] = React.useReducer(x => x + 1, 0)
  const store = typeof document !== 'undefined' ? getToastStore(document) : null

  React.useLayoutEffect(() => {
    setToastDefaults({
      duration: defaultDuration,
      position: defaultPosition,
      limit,
    })
  }, [defaultDuration, defaultPosition, limit])

  React.useLayoutEffect(() => {
    if (typeof document === 'undefined') return
    registerToastDocument(document)
    return () => unregisterToastDocument(document)
  }, [])

  React.useLayoutEffect(() => {
    if (!store) return
    const onStoreChange = () => forceUpdate()
    store.subscribers.add(onStoreChange)
    return () => {
      store.subscribers.delete(onStoreChange)
    }
  }, [store])

  return store
}
