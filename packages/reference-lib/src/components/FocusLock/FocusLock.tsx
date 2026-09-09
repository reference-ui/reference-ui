import * as React from 'react'
import { isNodeInside } from '../Overlay/shared/events'
import {
  findFocusableProximity,
  getTabbableCandidates,
  isElementFocusable,
} from './candidates'

export type FocusTarget =
  | HTMLElement
  | React.RefObject<HTMLElement | null>
  | (() => HTMLElement | null)

export interface FocusLockProps {
  children?: React.ReactElement | null | false
  disabled?: boolean
  initialFocus?: FocusTarget | boolean
  restoreFocus?: FocusTarget | boolean
  defaultRestoreTarget?: FocusTarget
  shards?: Array<HTMLElement | React.RefObject<HTMLElement | null>>
}

function resolveFocusTarget(target?: FocusTarget | boolean | null): HTMLElement | null {
  if (!target || target === true || typeof target === 'boolean') {
    return null
  }
  if (typeof target === 'function') {
    return target()
  }
  if (typeof target === 'object' && 'current' in target) {
    return target.current
  }
  if (target instanceof HTMLElement) {
    return target
  }
  return null
}

type LockEntry = {
  id: string
  container: HTMLElement
  shards: () => HTMLElement[]
  lastFocusedNode: React.MutableRefObject<HTMLElement | null>
}

const activeLocks: LockEntry[] = []

let lockIdCounter = 0

function pruneLocks() {
  for (let i = activeLocks.length - 1; i >= 0; i--) {
    if (!activeLocks[i].container.isConnected) {
      activeLocks.splice(i, 1)
    }
  }
}

function isTopLock(lockId: string, doc: Document) {
  pruneLocks()
  const live = activeLocks.filter(lock => lock.container.ownerDocument === doc)
  return live[live.length - 1]?.id === lockId
}

function isInsideLock(container: HTMLElement, shards: HTMLElement[], node: Node | null) {
  if (!node) return false
  if (isNodeInside(container, node)) return true
  return shards.some(shard => isNodeInside(shard, node))
}

export const FocusLock = React.forwardRef<HTMLElement, FocusLockProps>(
  function FocusLock(
    {
      children,
      disabled = false,
      initialFocus,
      restoreFocus = true,
      defaultRestoreTarget,
      shards: shardsProp,
    },
    forwardedRef
  ) {
    const containerRef = React.useRef<HTMLElement | null>(null)
    const lastFocusedNodeRef = React.useRef<HTMLElement | null>(null)
    const previousActiveElementRef = React.useRef<{
      node: HTMLElement | null
      parent: HTMLElement | null
      next: Node | null
      prev: Node | null
    } | null>(null)
    const restoredRef = React.useRef(false)
    const restoreTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

    const lockIdRef = React.useRef<string | null>(null)
    if (!lockIdRef.current) {
      lockIdRef.current = `lock-${++lockIdCounter}`
    }
    const lockId = lockIdRef.current

    const getResolvedShards = React.useCallback((): HTMLElement[] => {
      if (!shardsProp) return []
      const list: HTMLElement[] = []
      for (const shard of shardsProp) {
        if (shard instanceof HTMLElement && shard.isConnected) {
          list.push(shard)
        } else if (shard && typeof shard === 'object' && 'current' in shard && shard.current) {
          list.push(shard.current)
        }
      }
      return list
    }, [shardsProp])

    const restoreFocusRef = React.useRef(restoreFocus)
    restoreFocusRef.current = restoreFocus
    const initialFocusRef = React.useRef(initialFocus)
    initialFocusRef.current = initialFocus

    const defaultRestoreTargetRef = React.useRef(defaultRestoreTarget)
    defaultRestoreTargetRef.current = defaultRestoreTarget

    const getResolvedShardsRef = React.useRef(getResolvedShards)
    getResolvedShardsRef.current = getResolvedShards

    const latestForwardedRef = React.useRef(forwardedRef)
    latestForwardedRef.current = forwardedRef
    const latestChildRef = React.useRef<React.Ref<HTMLElement> | undefined>(undefined)
    const composedRef = React.useCallback((node: HTMLElement | null) => {
      containerRef.current = node
      const forwarded = latestForwardedRef.current
      if (typeof forwarded === 'function') {
        forwarded(node)
      } else if (forwarded && typeof forwarded === 'object' && 'current' in forwarded) {
        ;(forwarded as React.MutableRefObject<HTMLElement | null>).current = node
      }
      const originalRef = latestChildRef.current
      if (typeof originalRef === 'function') {
        originalRef(node)
      } else if (originalRef && typeof originalRef === 'object' && 'current' in originalRef) {
        ;(originalRef as React.MutableRefObject<HTMLElement | null>).current = node
      }
    }, [])

    const restoreOnce = React.useCallback((doc: Document) => {
      if (restoredRef.current) return
      const latestRestoreFocus = restoreFocusRef.current
      if (latestRestoreFocus === false) {
        restoredRef.current = true
        return
      }

      const explicitRestore = resolveFocusTarget(latestRestoreFocus)
      const captured = previousActiveElementRef.current
      const defaultTarget = resolveFocusTarget(defaultRestoreTargetRef.current)

      let target: HTMLElement | null = null
      if (explicitRestore && isElementFocusable(explicitRestore)) {
        target = explicitRestore
      } else if (captured?.node && captured.node.isConnected && isElementFocusable(captured.node)) {
        target = captured.node
      } else if (captured) {
        target = findFocusableProximity(captured.node, captured.parent, captured.next, captured.prev)
      }
      if (!target && defaultTarget && isElementFocusable(defaultTarget)) {
        target = defaultTarget
      }

      restoredRef.current = true
      if (target && doc.activeElement !== target) {
        target.focus({ preventScroll: true })
      }
    }, [])

    React.useEffect(() => {
      if (restoreTimerRef.current != null) {
        clearTimeout(restoreTimerRef.current)
        restoreTimerRef.current = null
      }

      if (disabled) {
        previousActiveElementRef.current = null
        return
      }

      const container = containerRef.current
      if (!container) return
      const doc = container.ownerDocument
      restoredRef.current = false

      if (!previousActiveElementRef.current) {
        const defaultTarget = resolveFocusTarget(defaultRestoreTargetRef.current)
        const active = doc.activeElement as HTMLElement | null
        const shards = getResolvedShardsRef.current()
        const origin =
          active &&
          active !== doc.body &&
          !isInsideLock(container, shards, active)
            ? active
            : defaultTarget && isElementFocusable(defaultTarget)
              ? defaultTarget
              : active
        previousActiveElementRef.current = {
          node: origin,
          parent: origin?.parentElement || null,
          next: origin?.nextElementSibling || null,
          prev: origin?.previousElementSibling || null,
        }
      }

      const lockEntry: LockEntry = {
        id: lockId,
        container,
        shards: () => getResolvedShardsRef.current(),
        lastFocusedNode: lastFocusedNodeRef,
      }
      activeLocks.push(lockEntry)

      const activationInitialFocus = initialFocusRef.current
      if (activationInitialFocus !== false) {
        const explicitTarget = resolveFocusTarget(activationInitialFocus)
        const shards = getResolvedShardsRef.current()
        const isTargetInContainer = (el: HTMLElement | null): el is HTMLElement => {
          if (!el || !isElementFocusable(el)) return false
          return isInsideLock(container, shards, el)
        }

        if (explicitTarget && isTargetInContainer(explicitTarget)) {
          if (doc.activeElement !== explicitTarget) {
            explicitTarget.focus({ preventScroll: true })
          }
          lastFocusedNodeRef.current = explicitTarget
        } else {
          const currentActive = doc.activeElement as HTMLElement | null
          if (currentActive && isTargetInContainer(currentActive) && currentActive !== container) {
            lastFocusedNodeRef.current = currentActive
          } else {
            const autoFocusCandidate = container.querySelector<HTMLElement>(
              '[autofocus], [data-autofocus]'
            )
            if (autoFocusCandidate && isElementFocusable(autoFocusCandidate)) {
              autoFocusCandidate.focus({ preventScroll: true })
              lastFocusedNodeRef.current = autoFocusCandidate
            } else {
              const tabbables = getTabbableCandidates(container, shards)
              if (tabbables.length > 0 && tabbables[0]) {
                tabbables[0].focus({ preventScroll: true })
                lastFocusedNodeRef.current = tabbables[0]
              } else {
                if (!container.hasAttribute('tabindex')) {
                  container.setAttribute('tabindex', '-1')
                }
                container.focus({ preventScroll: true })
                lastFocusedNodeRef.current = container
              }
            }
          }
        }
      }

      return () => {
        const index = activeLocks.findIndex(lock => lock.id === lockId)
        if (index !== -1) {
          activeLocks.splice(index, 1)
        }
        restoreTimerRef.current = setTimeout(() => {
          restoreTimerRef.current = null
          restoreOnce(doc)
        }, 0)
      }
    }, [disabled, lockId, restoreOnce])

    React.useEffect(() => {
      if (disabled) return
      const container = containerRef.current
      if (!container) return
      const doc = container.ownerDocument

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key !== 'Tab' || !isTopLock(lockId, doc)) return
        if (event.ctrlKey || event.altKey || event.metaKey) return

        if (initialFocus === false && !lastFocusedNodeRef.current) {
          return
        }

        const resolvedShards = getResolvedShardsRef.current()
        const tabbables = getTabbableCandidates(container, resolvedShards)

        if (tabbables.length === 0) {
          event.preventDefault()
          container.focus({ preventScroll: true })
          return
        }

        const first = tabbables[0]
        const last = tabbables[tabbables.length - 1]
        const active = doc.activeElement as HTMLElement | null
        const inside = isInsideLock(container, resolvedShards, active)

        if (!inside) {
          event.preventDefault()
          if (event.shiftKey) {
            last?.focus({ preventScroll: true })
          } else {
            first?.focus({ preventScroll: true })
          }
          return
        }

        if (!event.shiftKey && active === last) {
          event.preventDefault()
          first?.focus({ preventScroll: true })
        } else if (event.shiftKey && (active === first || active === container)) {
          event.preventDefault()
          last?.focus({ preventScroll: true })
        }
      }

      const handleFocusIn = (event: FocusEvent) => {
        if (!isTopLock(lockId, doc)) return
        const target = event.target
        if (!(target instanceof Node)) return

        const resolvedShards = getResolvedShardsRef.current()
        if (isInsideLock(container, resolvedShards, target)) {
          if (target instanceof HTMLElement) {
            lastFocusedNodeRef.current = target
          }
          return
        }

        if (initialFocus === false && !lastFocusedNodeRef.current) {
          return
        }

        const fallback =
          lastFocusedNodeRef.current && isElementFocusable(lastFocusedNodeRef.current)
            ? lastFocusedNodeRef.current
            : getTabbableCandidates(container, resolvedShards)[0] || container

        fallback.focus({ preventScroll: true })
      }

      const mutationObserver = new MutationObserver(() => {
        if (!isTopLock(lockId, doc)) return
        const focusedElement = doc.activeElement as HTMLElement | null
        const resolvedShards = getResolvedShardsRef.current()
        if (focusedElement && focusedElement !== doc.body && isInsideLock(container, resolvedShards, focusedElement)) {
          return
        }
        const last = lastFocusedNodeRef.current
        const fallback =
          last && last.isConnected && isElementFocusable(last) && isInsideLock(container, resolvedShards, last)
            ? last
            : getTabbableCandidates(container, resolvedShards)[0] || container
        if (doc.activeElement !== fallback) {
          fallback.focus({ preventScroll: true })
        }
        lastFocusedNodeRef.current = fallback
      })
      mutationObserver.observe(doc.documentElement, { childList: true, subtree: true })

      doc.addEventListener('keydown', handleKeyDown)
      doc.addEventListener('focusin', handleFocusIn)

      return () => {
        mutationObserver.disconnect()
        doc.removeEventListener('keydown', handleKeyDown)
        doc.removeEventListener('focusin', handleFocusIn)
      }
    }, [disabled, lockId, initialFocus])

    if (!children) {
      return null
    }

    if (typeof children !== 'object' || !React.isValidElement(children)) {
      throw new Error('Reference UI: FocusLock expects a single valid React element child.')
    }

    const child = children as React.ReactElement<{ ref?: React.Ref<HTMLElement> }>
    latestChildRef.current =
      (child as { ref?: React.Ref<HTMLElement> }).ref ?? child.props?.ref

    return React.cloneElement(child, {
      ref: composedRef,
    })
  }
)
FocusLock.displayName = 'FocusLock'
