/**
 * Pure numeric model for Slider primitive.
 * Enforces strict validation, step grid anchored at min, decimal precision,
 * Page step derivation, and neighbor collision math.
 */

import type { SliderValue } from './Slider'

export function getDecimalPrecision(num: number): number {
  if (!Number.isFinite(num)) return 0
  const numStr = num.toString()
  if (numStr.includes('e-')) {
    const [base, exp] = numStr.split('e-')
    const baseDecimals = base.includes('.') ? base.split('.')[1].length : 0
    return baseDecimals + parseInt(exp, 10)
  }
  const dec = numStr.split('.')[1]
  return dec ? dec.length : 0
}

export function roundToPrecision(num: number, precision: number): number {
  if (!Number.isFinite(num)) return num
  const p = Math.min(20, Math.max(0, precision))
  return Number(num.toFixed(p))
}

export interface SliderConfig {
  min?: number
  max?: number
  step?: number
  minStepsBetweenThumbs?: number
  value: SliderValue
}

export function validateSliderConfig(config: SliderConfig): void {
  const min = config.min ?? 0
  const max = config.max ?? 100
  const step = config.step ?? 1
  const minStepsBetweenThumbs = config.minStepsBetweenThumbs ?? 0

  if (typeof min !== 'number' || !Number.isFinite(min)) {
    throw new Error(`[Slider] 'min' must be a finite number, received ${min}`)
  }
  if (typeof max !== 'number' || !Number.isFinite(max)) {
    throw new Error(`[Slider] 'max' must be a finite number, received ${max}`)
  }
  if (min >= max) {
    throw new Error(`[Slider] 'min' (${min}) must be strictly less than 'max' (${max})`)
  }

  if (typeof step !== 'number' || !Number.isFinite(step) || step <= 0) {
    throw new Error(`[Slider] 'step' must be a positive number, received ${step}`)
  }

  if (
    config.minStepsBetweenThumbs !== undefined &&
    (typeof minStepsBetweenThumbs !== 'number' ||
      !Number.isInteger(minStepsBetweenThumbs) ||
      minStepsBetweenThumbs < 0 ||
      !Number.isFinite(minStepsBetweenThumbs))
  ) {
    throw new Error(
      `[Slider] 'minStepsBetweenThumbs' must be a non-negative integer, received ${config.minStepsBetweenThumbs}`
    )
  }

  const { value } = config
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error(`[Slider] 'value' must be a finite number, received ${value}`)
    }
  } else if (Array.isArray(value)) {
    if (value.length === 0) {
      throw new Error(`[Slider] Multi-thumb 'value' array cannot be empty`)
    }
    const precision = Math.max(getDecimalPrecision(step), getDecimalPrecision(min))
    const minDistance = roundToPrecision(minStepsBetweenThumbs * step, precision)

    for (let i = 0; i < value.length; i++) {
      const v = value[i]
      if (typeof v !== 'number' || !Number.isFinite(v)) {
        throw new Error(`[Slider] Array entry at index ${i} must be a finite number, received ${v}`)
      }
      if (i > 0) {
        if (v < value[i - 1]) {
          throw new Error(
            `[Slider] Multi-thumb 'value' array must be sorted in non-decreasing order: index ${i - 1} (${value[i - 1]}) > index ${i} (${v})`
          )
        }
        const gap = roundToPrecision(v - value[i - 1], precision)
        if (gap < minDistance) {
          throw new Error(
            `[Slider] Multi-thumb distance between index ${i - 1} (${value[i - 1]}) and index ${i} (${v}) is ${gap}, which violates minimum required distance of ${minDistance} (${minStepsBetweenThumbs} steps * ${step})`
          )
        }
      }
    }
  } else {
    throw new Error(`[Slider] 'value' must be a number or array of numbers, received ${typeof value}`)
  }
}

export function snapValueToStep(val: number, min: number, max: number, step: number): number {
  const precision = Math.max(getDecimalPrecision(step), getDecimalPrecision(min))
  const stepCount = Math.round((val - min) / step)
  const snapped = min + stepCount * step
  const rounded = roundToPrecision(snapped, precision)

  const maxSteps = Math.floor(roundToPrecision((max - min) / step, 10))
  const maxSnapped = roundToPrecision(min + maxSteps * step, precision)

  return Math.max(min, Math.min(maxSnapped, rounded))
}

export function stepValue(
  currentVal: number,
  direction: 1 | -1,
  min: number,
  max: number,
  step: number
): number {
  const precision = Math.max(
    getDecimalPrecision(step),
    getDecimalPrecision(min),
    getDecimalPrecision(currentVal)
  )
  const steps = (currentVal - min) / step
  const eps = 1e-9

  let targetSteps: number
  if (direction === 1) {
    if (Math.abs(steps - Math.round(steps)) < eps) {
      targetSteps = Math.round(steps) + 1
    } else {
      targetSteps = Math.floor(steps) + 1
    }
  } else {
    if (Math.abs(steps - Math.round(steps)) < eps) {
      targetSteps = Math.round(steps) - 1
    } else {
      targetSteps = Math.ceil(steps) - 1
    }
  }

  const maxSteps = Math.floor(roundToPrecision((max - min) / step, 10))
  const clampedSteps = Math.max(0, Math.min(maxSteps, targetSteps))
  const result = min + clampedSteps * step
  return roundToPrecision(result, precision)
}

export function getPageStep(min: number, max: number, step: number): number {
  const precision = Math.max(getDecimalPrecision(step), getDecimalPrecision(min))
  const stepsCoveringTenth = Math.max(1, Math.ceil(roundToPrecision((max - min) / 10 / step, 10)))
  return roundToPrecision(stepsCoveringTenth * step, precision)
}

export function getThumbBounds(
  values: number[],
  index: number,
  min: number,
  max: number,
  step: number,
  minStepsBetweenThumbs: number
): { min: number; max: number } {
  const precision = Math.max(getDecimalPrecision(step), getDecimalPrecision(min))
  const minDistance = roundToPrecision(minStepsBetweenThumbs * step, precision)

  const lowerBound =
    index > 0 ? roundToPrecision(values[index - 1] + minDistance, precision) : min
  const upperBound =
    index < values.length - 1 ? roundToPrecision(values[index + 1] - minDistance, precision) : max

  return { min: lowerBound, max: upperBound }
}

export function valueToPercent(value: number, min: number, max: number): number {
  if (max <= min) return 0
  const clamped = Math.max(min, Math.min(max, value))
  return ((clamped - min) / (max - min)) * 100
}

export function percentToValue(percent: number, min: number, max: number): number {
  if (max <= min) return min
  const clampedPercent = Math.max(0, Math.min(100, percent))
  return min + (clampedPercent / 100) * (max - min)
}
