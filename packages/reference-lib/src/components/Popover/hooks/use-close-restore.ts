/**
 * Popover close restore: Popover runs no FocusLock, so closing with focus
 * inside Content (Escape, Close, a controlled close) would leave the
 * focused node to unmount and drop focus to the body. On the close edge
 * this returns focus to the `restoreFocus` target, the Trigger by default,
 * unless the prop is `false`, focus already left Content, or the target is
 * gone or unfocusable. The move goes through the intent's `returnFocus` so
 * a hover card does not reopen when its Trigger regains focus.
 */
import * as React from 'react'
import type { FocusTarget } from '../../FocusLock'
import { isElementFocusable } from '../../FocusLock/catalog/eligibility'
import { resolveFocusTarget } from '../../FocusLock/shared/targets'

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect

export interface CloseRestoreOptions {
  isOpen: boolean
  restoreFocus: boolean | FocusTarget | undefined
  contentRef: React.RefObject<HTMLElement | null> | undefined
  triggerRef: React.RefObject<HTMLElement | null> | undefined
  returnFocus: ((target: HTMLElement) => void) | undefined
}

export function useCloseRestore(options: CloseRestoreOptions) {
  const { isOpen } = options
  const latest = React.useRef(options)
  latest.current = options
  const wasOpenRef = React.useRef(isOpen)

  // Layout timing: Content is still mounted on the close commit, so the
  // focused node is still inside it and no frame paints with focus lost.
  useIsomorphicLayoutEffect(() => {
    const wasOpen = wasOpenRef.current
    wasOpenRef.current = isOpen
    if (!wasOpen || isOpen) return
    const { restoreFocus, contentRef, triggerRef, returnFocus } = latest.current
    const content = contentRef?.current
    if (restoreFocus === false || !content || !returnFocus) return
    if (!content.contains(content.ownerDocument.activeElement)) return
    const target = resolveFocusTarget(restoreFocus) ?? triggerRef?.current ?? null
    if (target && target.isConnected && isElementFocusable(target)) returnFocus(target)
  }, [isOpen])
}
