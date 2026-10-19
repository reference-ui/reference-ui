/**
 * APG header traversal: the root keydown handler behind `keyboard="headers"`
 * (`"arrows"` is the same behavior under its base-API alias). Consumer
 * handlers run first, `none` opts out, and anything outside
 * Arrow/Home/End or sourced inside an item Content is ignored (AC-KEY-07).
 * Otherwise focus moves across the root's own enabled headers with
 * wrap-around arrows and edge-landing Home/End.
 */
import * as React from 'react'
import type { AccordionKeyboard } from '../types'
import { collectHeaderTriggers, isInsideContentOf } from '../keyboard/scope'
import {
  findNextEnabledIndex,
  firstEnabledIndex,
  lastEnabledIndex,
} from '../keyboard/traversal'

export interface HeaderKeyboardOptions {
  rootRef: React.RefObject<HTMLDivElement | null>
  keyboard: AccordionKeyboard
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>
}

export function useHeaderKeyboard({ rootRef, keyboard, onKeyDown }: HeaderKeyboardOptions) {
  return (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || keyboard === 'none') return

    if (
      e.key !== 'ArrowDown' &&
      e.key !== 'ArrowUp' &&
      e.key !== 'Home' &&
      e.key !== 'End'
    ) {
      return
    }

    const rootEl = rootRef.current
    if (!rootEl) return

    const activeEl = document.activeElement as HTMLElement | null
    const targetEl = e.target as HTMLElement | null

    // AC-KEY-07: Ignore keys originating inside item Content of this Accordion
    const sourceEl = (activeEl && rootEl.contains(activeEl)) ? activeEl : targetEl
    if (sourceEl && isInsideContentOf(sourceEl, rootEl)) {
      return
    }

    const allTriggers = collectHeaderTriggers(rootEl)

    if (allTriggers.length === 0) return

    let activeIndex = -1
    if (activeEl && rootEl.contains(activeEl)) {
      activeIndex = allTriggers.findIndex(
        (btn) => btn === activeEl || btn.contains(activeEl)
      )
    }
    if (activeIndex === -1 && targetEl && rootEl.contains(targetEl)) {
      activeIndex = allTriggers.findIndex(
        (btn) => btn === targetEl || btn.contains(targetEl)
      )
    }
    if (activeIndex === -1) return

    let targetIndex = -1

    if (e.key === 'ArrowDown') {
      targetIndex = findNextEnabledIndex(allTriggers, activeIndex, 1)
    } else if (e.key === 'ArrowUp') {
      targetIndex = findNextEnabledIndex(allTriggers, activeIndex, -1)
    } else if (e.key === 'Home') {
      targetIndex = firstEnabledIndex(allTriggers)
    } else if (e.key === 'End') {
      targetIndex = lastEnabledIndex(allTriggers)
    }

    if (targetIndex !== -1 && allTriggers[targetIndex]) {
      e.preventDefault()
      allTriggers[targetIndex]?.focus()
    }
  }
}
