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

function locksForDocument(doc: Document) {
  pruneLocks()
  return activeLocks.filter(lock => lock.container.ownerDocument === doc)
}

function isTopLock(lockId: string, doc: Document) {
  const live = locksForDocument(doc)
  return live[live.length - 1]?.id === lockId
}

function isInsideLock(container: HTMLElement, shards: HTMLElement[], node: Node | null) {
  if (!node) return false
  if (isNodeInside(container, node)) return true
  return shards.some(shard => isNodeInside(shard, node))
}

function deepActiveElement(doc: Document): HTMLElement | null {
  let active: Element | null = doc.activeElement
  while (active instanceof HTMLElement && active.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement
  }
  return active instanceof HTMLElement ? active : null
}

function safeFocus(node: HTMLElement | null) {
  if (!node || !node.isConnected) return
  if (deepActiveElement(node.ownerDocument) === node) return
  node.focus({ preventScroll: true })
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
    const previousValidNodeRef = React.useRef<HTMLElement | null>(null)
    const previousActiveElementRef = React.useRef<{
      node: HTMLElement | null
      parent: HTMLElement | null
      next: Node | null
      prev: Node | null
    } | null>(null)
    const restoredRef = React.useRef(false)
    const restoreTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const reclaimFrameRef = React.useRef<number | null>(null)
    const addedTabIndexRef = React.useRef(false)
    const movingFocusRef = React.useRef(false)

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
        } else if (
          shard &&
          typeof shard === 'object' &&
          'current' in shard &&
          shard.current instanceof HTMLElement &&
          shard.current.isConnected
        ) {
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

    const rememberInside = React.useCallback((node: HTMLElement | null) => {
      if (!node) return
      const previous = lastFocusedNodeRef.current
      if (previous && previous !== node && previous.isConnected) {
        previousValidNodeRef.current = previous
      }
      lastFocusedNodeRef.current = node
    }, [])

    const pickInsideFallback = React.useCallback(
      (container: HTMLElement, shards: HTMLElement[]): HTMLElement => {
        const last = lastFocusedNodeRef.current
        if (
          last &&
          last.isConnected &&
          isElementFocusable(last) &&
          isInsideLock(container, shards, last)
        ) {
          return last
        }
        const previous = previousValidNodeRef.current
        if (
          previous &&
          previous.isConnected &&
          isElementFocusable(previous) &&
          isInsideLock(container, shards, previous)
        ) {
          return previous
        }
        return getTabbableCandidates(container, shards)[0] || container
      },
      []
    )

    const restoreOnce = React.useCallback((doc: Document, container: HTMLElement | null) => {
      if (restoredRef.current) return
      const latestRestoreFocus = restoreFocusRef.current
      if (latestRestoreFocus === false) {
        restoredRef.current = true
        return
      }

      const active = doc.activeElement as HTMLElement | null
      const shards = getResolvedShardsRef.current()
      const alreadyMoved =
        active &&
        active !== doc.body &&
        active.isConnected &&
        isElementFocusable(active) &&
        (!container || !container.isConnected || !isInsideLock(container, shards, active))
      if (alreadyMoved) {
        restoredRef.current = true
        return
      }

      const explicitRestore = resolveFocusTarget(latestRestoreFocus)
      const captured = previousActiveElementRef.current
      const defaultTarget = resolveFocusTarget(defaultRestoreTargetRef.current)

      let target: HTMLElement | null = null
      if (explicitRestore && explicitRestore.isConnected && isElementFocusable(explicitRestore)) {
        target = explicitRestore
      } else if (captured?.node && captured.node.isConnected && isElementFocusable(captured.node)) {
        target = captured.node
      } else if (captured) {
        target = findFocusableProximity(captured.node, captured.parent, captured.next, captured.prev)
      }
      if (!target && defaultTarget && defaultTarget.isConnected && isElementFocusable(defaultTarget)) {
        target = defaultTarget
      }

      restoredRef.current = true
      if (target) safeFocus(target)
    }, [])

    const clearReclaimFrame = React.useCallback(() => {
      if (reclaimFrameRef.current != null) {
        cancelAnimationFrame(reclaimFrameRef.current)
        reclaimFrameRef.current = null
      }
    }, [])

    const scheduleRestore = React.useCallback(
      (doc: Document, container: HTMLElement | null) => {
        if (restoreTimerRef.current != null) {
          clearTimeout(restoreTimerRef.current)
        }
        restoreTimerRef.current = setTimeout(() => {
          restoreTimerRef.current = null
          restoreOnce(doc, container)
        }, 0)
      },
      [restoreOnce]
    )

    React.useEffect(() => {
      if (disabled) {
        return
      }

      if (restoreTimerRef.current != null) {
        clearTimeout(restoreTimerRef.current)
        restoreTimerRef.current = null
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
            movingFocusRef.current = true
            explicitTarget.focus({ preventScroll: true })
            movingFocusRef.current = false
          }
          rememberInside(explicitTarget)
        } else {
          const currentActive = doc.activeElement as HTMLElement | null
          if (currentActive && isTargetInContainer(currentActive) && currentActive !== container) {
            rememberInside(currentActive)
          } else {
            const tabbables = getTabbableCandidates(container, shards)
            if (tabbables.length > 0 && tabbables[0]) {
              movingFocusRef.current = true
              tabbables[0].focus({ preventScroll: true })
              movingFocusRef.current = false
              rememberInside(tabbables[0])
            } else {
              if (!container.hasAttribute('tabindex')) {
                container.setAttribute('tabindex', '-1')
                addedTabIndexRef.current = true
              }
              movingFocusRef.current = true
              container.focus({ preventScroll: true })
              movingFocusRef.current = false
              rememberInside(container)
            }
          }
        }
      }

      return () => {
        clearReclaimFrame()
        const live = locksForDocument(doc)
        const wasTop = live[live.length - 1]?.id === lockId
        const index = activeLocks.findIndex(lock => lock.id === lockId)
        if (index !== -1) {
          activeLocks.splice(index, 1)
        }
        if (addedTabIndexRef.current && container.hasAttribute('tabindex')) {
          container.removeAttribute('tabindex')
          addedTabIndexRef.current = false
        }
        const remaining = locksForDocument(doc)
        if (!wasTop && remaining.length > 0) {
          return
        }
        scheduleRestore(doc, container)
      }
    }, [clearReclaimFrame, disabled, lockId, rememberInside, scheduleRestore])

    React.useEffect(() => {
      if (disabled) return
      const container = containerRef.current
      if (!container) return
      const doc = container.ownerDocument

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key !== 'Tab' || !isTopLock(lockId, doc)) return
        if (event.defaultPrevented) return
        if (event.ctrlKey || event.altKey || event.metaKey) return

        if (initialFocusRef.current === false && !lastFocusedNodeRef.current) {
          return
        }

        const resolvedShards = getResolvedShardsRef.current()
        const tabbables = getTabbableCandidates(container, resolvedShards)

        if (tabbables.length === 0) {
          event.preventDefault()
          safeFocus(container)
          return
        }

        const first = tabbables[0]
        const last = tabbables[tabbables.length - 1]
        const active = deepActiveElement(doc)
        const inside = isInsideLock(container, resolvedShards, active)

        event.preventDefault()
        if (!inside || !active || !tabbables.includes(active)) {
          safeFocus(event.shiftKey ? last : first)
          return
        }

        const index = tabbables.indexOf(active)
        if (!event.shiftKey) {
          safeFocus(tabbables[index + 1] ?? first)
        } else {
          safeFocus(tabbables[index - 1] ?? last)
        }
      }

      const reclaimToFallback = () => {
        if (!isTopLock(lockId, doc)) return
        if (movingFocusRef.current) return
        const resolvedShards = getResolvedShardsRef.current()
        const fallback = pickInsideFallback(container, resolvedShards)
        movingFocusRef.current = true
        safeFocus(fallback)
        movingFocusRef.current = false
        rememberInside(fallback)
      }

      const queueReclaim = () => {
        if (reclaimFrameRef.current != null) return
        reclaimFrameRef.current = requestAnimationFrame(() => {
          reclaimFrameRef.current = null
          if (!container.isConnected) return
          reclaimToFallback()
        })
      }

      const handleFocusIn = (event: FocusEvent) => {
        if (!isTopLock(lockId, doc)) return
        if (movingFocusRef.current) return
        const target = event.target
        if (!(target instanceof Node)) return

        const resolvedShards = getResolvedShardsRef.current()
        if (isInsideLock(container, resolvedShards, target)) {
          if (target instanceof HTMLElement) {
            rememberInside(target)
          }
          return
        }

        if (initialFocusRef.current === false && !lastFocusedNodeRef.current) {
          return
        }

        if (
          event.relatedTarget === null &&
          (target === doc.body || target === doc.documentElement)
        ) {
          return
        }

        reclaimToFallback()
      }

      const mutationObserver = new MutationObserver(() => {
        if (!isTopLock(lockId, doc)) return
        if (movingFocusRef.current) return
        const focusedElement = doc.activeElement as HTMLElement | null
        const resolvedShards = getResolvedShardsRef.current()
        if (
          focusedElement &&
          focusedElement !== doc.body &&
          isInsideLock(container, resolvedShards, focusedElement) &&
          isElementFocusable(focusedElement)
        ) {
          rememberInside(focusedElement)
          return
        }
        queueReclaim()
      })
      mutationObserver.observe(doc.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: [
          'disabled',
          'hidden',
          'inert',
          'open',
          'style',
          'class',
          'tabindex',
          'contenteditable',
        ],
      })

      doc.addEventListener('keydown', handleKeyDown)
      doc.addEventListener('focusin', handleFocusIn)

      return () => {
        clearReclaimFrame()
        mutationObserver.disconnect()
        doc.removeEventListener('keydown', handleKeyDown)
        doc.removeEventListener('focusin', handleFocusIn)
      }
    }, [clearReclaimFrame, disabled, lockId, pickInsideFallback, rememberInside])

    if (!children) {
      return null
    }

    if (typeof children !== 'object' || !React.isValidElement(children)) {
      throw new Error('Reference UI: FocusLock expects a single valid React element child.')
    }

    if (children.type === React.Fragment) {
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
