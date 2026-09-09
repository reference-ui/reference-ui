import * as React from 'react'

type PointerLockState = {
  count: number
  restore: () => void
}

const locks = new WeakMap<Document, PointerLockState>()

function apply(doc: Document): () => void {
  const body = doc.body
  const prevBody = body.style.getPropertyValue('pointer-events')
  const prevPriority = body.style.getPropertyPriority('pointer-events')
  body.style.setProperty('pointer-events', 'none')

  return () => {
    if (prevBody) {
      body.style.setProperty('pointer-events', prevBody, prevPriority)
    } else {
      body.style.removeProperty('pointer-events')
    }
  }
}

export function acquirePointerLock(doc: Document): () => void {
  const existing = locks.get(doc)
  if (existing) {
    existing.count += 1
    return () => {
      existing.count -= 1
      if (existing.count <= 0) {
        existing.restore()
        locks.delete(doc)
      }
    }
  }

  const lock: PointerLockState = { count: 1, restore: apply(doc) }
  locks.set(doc, lock)
  return () => {
    lock.count -= 1
    if (lock.count <= 0) {
      lock.restore()
      locks.delete(doc)
    }
  }
}

export function usePointerLock(enabled: boolean, doc?: Document | null) {
  React.useEffect(() => {
    if (!enabled) return
    const targetDoc = doc ?? (typeof document !== 'undefined' ? document : null)
    if (!targetDoc) return
    return acquirePointerLock(targetDoc)
  }, [enabled, doc])
}
