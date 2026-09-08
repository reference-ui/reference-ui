import * as React from 'react'

type Lock = {
  count: number
  restore: () => void
}

const locks = new WeakMap<Document, Lock>()

function apply(doc: Document): () => void {
  const body = doc.body
  const prevBody = body.style.pointerEvents
  body.style.pointerEvents = 'none'

  const style = doc.createElement('style')
  style.setAttribute('data-reference-overlay-pointer-lock', '')
  style.textContent =
    '[data-reference-overlay-content],[data-reference-overlay-backdrop]{pointer-events:auto!important}'
  doc.head.appendChild(style)

  return () => {
    body.style.pointerEvents = prevBody
    style.remove()
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

  const lock: Lock = { count: 1, restore: apply(doc) }
  locks.set(doc, lock)
  return () => {
    lock.count -= 1
    if (lock.count <= 0) {
      lock.restore()
      locks.delete(doc)
    }
  }
}

export function usePointerLock(enabled: boolean) {
  React.useEffect(() => {
    if (!enabled || typeof document === 'undefined') return
    return acquirePointerLock(document)
  }, [enabled])
}
