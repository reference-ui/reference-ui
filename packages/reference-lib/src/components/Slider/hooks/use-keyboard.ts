/**
 * useKeyboard: thumb keyboard and focus behavior. Arrow keys step within the
 * thumb's feasible window (horizontal RTL reverses Left/Right only), Page
 * keys jump a page step, Home/End land on the window edges; modified keys
 * pass through untouched. Key repeats share one session that reports a
 * single onChangeEnd on keyup, and focus tracks the active thumb plus the
 * focus-visible ring by input modality.
 */
import * as React from 'react'
import { isFocusVisible } from '../../../core/theme/primitives/forms/focus-visible'
import { countMismatchMessage } from '../shared/registry'
import { getPageStep, getThumbBounds, snapValueToStep, stepValue } from '../math/slider-math'
import type { ThumbRegistry } from './use-thumb-registry'
import type { ValueRequest } from './use-value-request'

export interface KeyboardOptions {
  disabled: boolean
  isRtl: boolean
  registry: ThumbRegistry
  valueApi: ValueRequest
  isPointerActive: () => boolean
  setFocusVisibleIndex: React.Dispatch<React.SetStateAction<number | null>>
  setActiveThumbIndex: React.Dispatch<React.SetStateAction<number | null>>
}

export interface Keyboard {
  handleThumbKeyDown: (e: React.KeyboardEvent<HTMLDivElement>, index: number) => void
  handleThumbKeyUp: (e: React.KeyboardEvent<HTMLDivElement>, index: number) => void
  handleThumbFocus: (e: React.FocusEvent<HTMLDivElement>, index: number) => void
  handleThumbBlur: (e: React.FocusEvent<HTMLDivElement>, index: number) => void
  resetKeySession: () => void
}

export function useKeyboard(options: KeyboardOptions): Keyboard {
  const {
    disabled,
    isRtl,
    registry,
    valueApi,
    isPointerActive,
    setFocusVisibleIndex,
    setActiveThumbIndex,
  } = options
  const { latestPropsRef, lastRequestedValueRef, requestThumbValue } = valueApi
  const { getThumbCount } = registry

  const hasChangedInKeySessionRef = React.useRef(false)
  const activeKeyRef = React.useRef<string | null>(null)

  const resetKeySession = React.useCallback(() => {
    hasChangedInKeySessionRef.current = false
    activeKeyRef.current = null
  }, [])

  const handleThumbKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>, index: number) => {
      if (disabled) return
      // Modified keys pass through untouched: Page keys own large steps,
      // and the application keeps every modified shortcut (SD-KEY-07).
      if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return

      const {
        min: curMin,
        max: curMax,
        step: curStep,
        minStepsBetweenThumbs: curMinSteps,
        orientation: curOrientation,
        values: curValues,
      } = latestPropsRef.current

      if (
        getThumbCount() !== curValues.length ||
        index < 0 ||
        index >= curValues.length
      ) {
        throw new Error(countMismatchMessage(curValues.length, getThumbCount()))
      }

      const isHoriz = curOrientation === 'horizontal'
      const curVal = curValues[index]
      const bounds = getThumbBounds(curValues, index, curMin, curMax, curStep, curMinSteps)
      const pageStep = getPageStep(curMin, curMax, curStep)

      let targetVal: number | null = null

      // Horizontal RTL reverses Left/Right only; vertical ignores direction.
      if (isHoriz) {
        if (isRtl) {
          if (e.key === 'ArrowLeft') targetVal = stepValue(curVal, 1, curMin, curMax, curStep)
          else if (e.key === 'ArrowRight') targetVal = stepValue(curVal, -1, curMin, curMax, curStep)
          else if (e.key === 'ArrowUp') targetVal = stepValue(curVal, 1, curMin, curMax, curStep)
          else if (e.key === 'ArrowDown') targetVal = stepValue(curVal, -1, curMin, curMax, curStep)
        } else {
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp')
            targetVal = stepValue(curVal, 1, curMin, curMax, curStep)
          else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown')
            targetVal = stepValue(curVal, -1, curMin, curMax, curStep)
        }
      } else {
        if (e.key === 'ArrowUp' || e.key === 'ArrowRight')
          targetVal = stepValue(curVal, 1, curMin, curMax, curStep)
        else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft')
          targetVal = stepValue(curVal, -1, curMin, curMax, curStep)
      }

      if (e.key === 'PageUp') {
        targetVal = snapValueToStep(curVal + pageStep, curMin, curMax, curStep)
      } else if (e.key === 'PageDown') {
        targetVal = snapValueToStep(curVal - pageStep, curMin, curMax, curStep)
      }

      if (e.key === 'Home') {
        targetVal = bounds.min
      } else if (e.key === 'End') {
        targetVal = bounds.max
      }

      if (targetVal === null) return

      setFocusVisibleIndex(index)
      setActiveThumbIndex(index)

      const clamped = Math.max(bounds.min, Math.min(bounds.max, targetVal))
      if (clamped !== curVal) {
        e.preventDefault()
        if (requestThumbValue(index, clamped)) {
          hasChangedInKeySessionRef.current = true
          activeKeyRef.current = e.key
        }
      } else {
        e.preventDefault()
      }
    },
    [disabled, isRtl, requestThumbValue]
  )

  const handleThumbKeyUp = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>, _index: number) => {
      if (disabled) return
      if (hasChangedInKeySessionRef.current && e.key === activeKeyRef.current) {
        hasChangedInKeySessionRef.current = false
        activeKeyRef.current = null
        const { onChangeEnd: curOnChangeEnd } = latestPropsRef.current
        curOnChangeEnd?.(lastRequestedValueRef.current)
      }
    },
    [disabled]
  )

  const handleThumbFocus = React.useCallback(
    (_e: React.FocusEvent<HTMLDivElement>, index: number) => {
      setActiveThumbIndex(index)
      if (!isPointerActive() && isFocusVisible()) {
        setFocusVisibleIndex(index)
      } else if (isPointerActive()) {
        setFocusVisibleIndex(null)
      }
    },
    [isPointerActive, setActiveThumbIndex, setFocusVisibleIndex]
  )

  const handleThumbBlur = React.useCallback(
    (_e: React.FocusEvent<HTMLDivElement>, index: number) => {
      setFocusVisibleIndex(current => (current === index ? null : current))
      if (hasChangedInKeySessionRef.current) {
        hasChangedInKeySessionRef.current = false
        activeKeyRef.current = null
      }
    },
    [setFocusVisibleIndex]
  )

  return {
    handleThumbKeyDown,
    handleThumbKeyUp,
    handleThumbFocus,
    handleThumbBlur,
    resetKeySession,
  }
}
