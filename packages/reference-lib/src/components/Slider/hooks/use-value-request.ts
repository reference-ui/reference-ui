/**
 * useValueRequest: the single choke point for value changes. latestPropsRef
 * keeps every render's config live for window listeners and stable callbacks,
 * requestThumbValue snaps and neighbor-clamps a candidate and emits it,
 * and lastRequestedValueRef tracks the latest request for end-of-session
 * onChangeEnd summaries.
 */
import * as React from 'react'
import type { SliderOrientation, SliderValue } from '../types'
import { getThumbBounds, snapValueToStep } from '../math/slider-math'

export interface ValueRequestConfig {
  min: number
  max: number
  step: number
  minStepsBetweenThumbs: number
  orientation: SliderOrientation
  disabled: boolean
  isRange: boolean
  values: number[]
  onChange: ((value: SliderValue) => void) | undefined
  onChangeEnd: ((value: SliderValue) => void) | undefined
}

export interface ValueRequest {
  latestPropsRef: React.MutableRefObject<ValueRequestConfig>
  lastRequestedValueRef: React.MutableRefObject<SliderValue>
  requestThumbValue: (index: number, raw: number) => boolean
}

export function useValueRequest(
  config: ValueRequestConfig,
  initialValue: SliderValue
): ValueRequest {
  const latestPropsRef = React.useRef(config)
  latestPropsRef.current = config

  const lastRequestedValueRef = React.useRef<SliderValue>(initialValue)

  // Snaps, neighbor-clamps, and requests a candidate; returns whether the
  // candidate differed. Tracks the last request for end-of-session summary.
  const requestThumbValue = React.useCallback((index: number, raw: number): boolean => {
    const {
      min: curMin,
      max: curMax,
      step: curStep,
      minStepsBetweenThumbs: curMinSteps,
      values: curValues,
      isRange: curIsRange,
      onChange: curOnChange,
    } = latestPropsRef.current
    if (index < 0 || index >= curValues.length) return false
    const snapped = snapValueToStep(raw, curMin, curMax, curStep)
    const bounds = getThumbBounds(curValues, index, curMin, curMax, curStep, curMinSteps)
    const clamped = Math.max(bounds.min, Math.min(bounds.max, snapped))
    if (clamped === curValues[index]) return false
    const nextValues = [...curValues]
    nextValues[index] = clamped
    const emitted: SliderValue = curIsRange ? nextValues : clamped
    lastRequestedValueRef.current = emitted
    curOnChange?.(emitted)
    return true
  }, [])

  return { latestPropsRef, lastRequestedValueRef, requestThumbValue }
}
