import * as React from 'react'
import { overlayStackStore } from '../Overlay/overlay-stack'

export type FocusTarget =
  | HTMLElement
  | React.RefObject<HTMLElement | null>
  | (() => HTMLElement | null)

export interface FocusLockProps {
  children?: React.ReactElement | null | false
  disabled?: boolean
  initialFocus?: FocusTarget | boolean
  restoreFocus?: FocusTarget | boolean
  shards?: Array<HTMLElement | React.RefObject<HTMLElement | null>>
}

// Candidate selectors
const CANDIDATE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]',
  '[contenteditable="true"]',
  'summary',
  'audio[controls]',
  'video[controls]',
  'iframe',
].join(',')

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

function isElementVisible(el: HTMLElement): boolean {
  if (!el.isConnected) return false
  if (el.hasAttribute('hidden') || el.closest('[hidden]')) return false
  if (el.hasAttribute('inert') || el.closest('[inert]')) return false

  try {
    const style = window.getComputedStyle(el)
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.visibility === 'collapse'
    ) {
      return false
    }
  } catch {
    // ignore
  }

  return true
}

function isElementFocusable(el: HTMLElement): boolean {
  if (!isElementVisible(el)) return false
  if ((el as any).disabled) return false

  // Check disabled fieldset
  const fieldset = el.closest('fieldset[disabled]')
  if (fieldset) {
    const firstLegend = fieldset.querySelector('legend')
    if (!firstLegend || !firstLegend.contains(el)) {
      return false
    }
  }

  return true
}

function getTabbableCandidates(container: HTMLElement, shards: HTMLElement[] = []): HTMLElement[] {
  const containers = [container, ...shards].filter(c => c && c.isConnected)
  const candidates: HTMLElement[] = []

  for (const root of containers) {
    const nodes = Array.from(root.querySelectorAll<HTMLElement>(CANDIDATE_SELECTORS))
    for (const node of nodes) {
      if (!isElementFocusable(node)) continue

      const tabIndex = node.getAttribute('tabindex')
      if (tabIndex !== null && parseInt(tabIndex, 10) < 0) {
        // -1 is focusable but not tabbable
        continue
      }

      // Handle radio groups: if a radio group has a checked radio, only the checked one is tabbable
      if (node instanceof HTMLInputElement && node.type === 'radio' && node.name) {
        const group = Array.from(
          root.querySelectorAll<HTMLInputElement>(
            `input[type="radio"][name="${node.name}"]`
          )
        ).filter(r => isElementFocusable(r))

        const checked = group.find(r => r.checked)
        if (checked && checked !== node) {
          continue
        }
      }

      candidates.push(node)
    }
  }

  return Array.from(new Set(candidates))
}

function findFocusableProximity(
  node: HTMLElement | null,
  parent: HTMLElement | null,
  next: Node | null,
  prev: Node | null
): HTMLElement | null {
  if (node && isElementFocusable(node) && node.isConnected) {
    return node
  }

  // Right siblings
  let curr = next as HTMLElement | null
  while (curr) {
    if (curr.isConnected) {
      if (isElementFocusable(curr)) return curr
      const desc = curr.querySelector<HTMLElement>(CANDIDATE_SELECTORS)
      if (desc && isElementFocusable(desc)) return desc
    }
    curr = curr.nextElementSibling as HTMLElement | null
  }

  // Left siblings
  curr = prev as HTMLElement | null
  while (curr) {
    if (curr.isConnected) {
      const focusables = Array.from(curr.querySelectorAll<HTMLElement>(CANDIDATE_SELECTORS)).filter(isElementFocusable)
      if (focusables.length > 0) return focusables[focusables.length - 1]
      if (isElementFocusable(curr)) return curr
    }
    curr = curr.previousElementSibling as HTMLElement | null
  }

  // Ancestors
  curr = parent
  while (curr) {
    if (curr.isConnected) {
      if (isElementFocusable(curr)) return curr
    }
    curr = curr.parentElement
  }

  return null
}

// Global active lock stack for nested FocusLocks
const activeLocks: Array<{
  id: string
  container: HTMLElement
  shards: () => HTMLElement[]
  lastFocusedNode: React.MutableRefObject<HTMLElement | null>
}> = []

let lockIdCounter = 0

export function FocusLock({
  children,
  disabled = false,
  initialFocus,
  restoreFocus = true,
  shards: shardsProp,
}: FocusLockProps) {
  const containerRef = React.useRef<HTMLElement | null>(null)
  const lastFocusedNodeRef = React.useRef<HTMLElement | null>(null)
  const previousActiveElementRef = React.useRef<{
    node: HTMLElement | null;
    parent: HTMLElement | null;
    next: Node | null;
    prev: Node | null;
  } | null>(null)

  const lockIdRef = React.useRef<string | null>(null)
  if (!lockIdRef.current) {
    lockIdRef.current = `lock-${++lockIdCounter}`
  }
  const lockId = lockIdRef.current

  const getResolvedShards = React.useCallback((): HTMLElement[] => {
    if (!shardsProp) return []
    const list: HTMLElement[] = []
    for (const s of shardsProp) {
      if (s instanceof HTMLElement && s.isConnected) {
        list.push(s)
      } else if (s && typeof s === 'object' && 'current' in s && s.current) {
        list.push(s.current)
      }
    }
    return list
  }, [shardsProp])

  // Activation & stack management
  React.useEffect(() => {
    if (disabled) {
      previousActiveElementRef.current = null
      return
    }

    const container = containerRef.current
    if (!container) return

    if (!previousActiveElementRef.current && typeof document !== 'undefined') {
      const active = document.activeElement as HTMLElement | null
      previousActiveElementRef.current = {
        node: active,
        parent: active?.parentElement || null,
        next: active?.nextSibling || null,
        prev: active?.previousSibling || null,
      }
    }

    const lockEntry = {
      id: lockId,
      container,
      shards: getResolvedShards,
      lastFocusedNode: lastFocusedNodeRef,
    }

    activeLocks.push(lockEntry)

    // Initial focus resolution
    if (initialFocus !== false) {
      const explicitTarget = resolveFocusTarget(initialFocus)
      if (explicitTarget && isElementFocusable(explicitTarget)) {
        explicitTarget.focus()
        lastFocusedNodeRef.current = explicitTarget
      } else {
        // Focus first tabbable descendant or container
        const tabbables = getTabbableCandidates(container, getResolvedShards())
        if (tabbables.length > 0 && tabbables[0]) {
          tabbables[0].focus()
          lastFocusedNodeRef.current = tabbables[0]
        } else {
          if (!container.hasAttribute('tabindex')) {
            container.setAttribute('tabindex', '-1')
          }
          container.focus()
          lastFocusedNodeRef.current = container
        }
      }
    }

    return () => {
      const index = activeLocks.findIndex(l => l.id === lockId)
      if (index !== -1) {
        activeLocks.splice(index, 1)
      }

      // Restore focus on deactivation/unmount
      if (restoreFocus !== false) {
        const explicitRestore = resolveFocusTarget(restoreFocus)
        if (explicitRestore && isElementFocusable(explicitRestore)) {
          explicitRestore.focus()
        } else if (previousActiveElementRef.current) {
          const proxy = findFocusableProximity(
            previousActiveElementRef.current.node,
            previousActiveElementRef.current.parent,
            previousActiveElementRef.current.next,
            previousActiveElementRef.current.prev
          )
          if (proxy) proxy.focus()
        }
      }
    }
  }, [disabled, lockId, initialFocus, restoreFocus, getResolvedShards])

  // Handle Tab looping and containment
  React.useEffect(() => {
    if (disabled) return
    const container = containerRef.current
    if (!container) return

    const isTopLock = () => {
      for (let i = activeLocks.length - 1; i >= 0; i--) {
        if (!activeLocks[i].container.isConnected) {
          activeLocks.splice(i, 1)
        }
      }
      const top = activeLocks[activeLocks.length - 1]
      return top?.id === lockId
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !isTopLock()) return
      if (e.ctrlKey || e.altKey || e.metaKey) return

      const resolvedShards = getResolvedShards()
      const tabbables = getTabbableCandidates(container, resolvedShards)

      if (tabbables.length === 0) {
        e.preventDefault()
        container.focus()
        return
      }

      const first = tabbables[0]
      const last = tabbables[tabbables.length - 1]
      const active = document.activeElement as HTMLElement | null

      if (!e.shiftKey && active === last) {
        e.preventDefault()
        first?.focus()
      } else if (e.shiftKey && active === first) {
        e.preventDefault()
        last?.focus()
      }
    }

    const handleFocusIn = (e: FocusEvent) => {
      if (!isTopLock()) return
      const target = e.target as HTMLElement | null
      if (!target) return

      const resolvedShards = getResolvedShards()
      const isInside =
        container.contains(target) ||
        resolvedShards.some(shard => shard.contains(target)) ||
        overlayStackStore.getState().layers.some(l => l.node?.contains(target)) ||
        Boolean(target.closest('[data-reference-overlay-content][data-state="open"]'))

      if (isInside) {
        lastFocusedNodeRef.current = target
      } else {
        // Reclaim focus
        const fallback =
          lastFocusedNodeRef.current && isElementFocusable(lastFocusedNodeRef.current)
            ? lastFocusedNodeRef.current
            : getTabbableCandidates(container, resolvedShards)[0] || container

        fallback.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('focusin', handleFocusIn)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('focusin', handleFocusIn)
    }
  }, [disabled, lockId, getResolvedShards])

  if (!children) {
    return null
  }

  if (typeof children !== 'object' || !React.isValidElement(children)) {
    throw new Error('Reference UI: FocusLock expects a single valid React element child.')
  }

  const child = children as React.ReactElement<any>
  const originalRef = (child.props as any)?.ref

  const composedRef = (node: HTMLElement | null) => {
    containerRef.current = node
    if (typeof originalRef === 'function') {
      originalRef(node)
    } else if (originalRef && typeof originalRef === 'object' && 'current' in originalRef) {
      ;(originalRef as React.MutableRefObject<HTMLElement | null>).current = node
    }
  }

  return React.cloneElement(child, {
    ref: composedRef,
  })
}
