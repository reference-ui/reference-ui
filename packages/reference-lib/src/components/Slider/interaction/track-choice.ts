/**
 * Track click resolution: pointerToSnappedValue maps a pointer position on
 * the track rect to a snapped value (null when the track has no measurable
 * extent), and chooseTrackThumb picks which thumb the click drives. The tie
 * rule is frozen: nearest movable thumb wins, ties prefer the most recently
 * active thumb, then the lower DOM index.
 */
import { getThumbBounds, snapValueToStep } from '../math/slider-math'

export interface TrackPointerInput {
  clientX: number
  clientY: number
  rect: { left: number; right: number; top: number; bottom: number; width: number; height: number }
  orientation: 'horizontal' | 'vertical'
  isRtl: boolean
  min: number
  max: number
  step: number
}

export function pointerToSnappedValue(input: TrackPointerInput): number | null {
  const { clientX, clientY, rect, orientation, isRtl, min, max, step } = input
  const isHorizontal = orientation === 'horizontal'
  if (isHorizontal && rect.width === 0) return null
  if (!isHorizontal && rect.height === 0) return null

  let clickPercent: number
  if (isHorizontal) {
    clickPercent = isRtl
      ? (rect.right - clientX) / rect.width
      : (clientX - rect.left) / rect.width
  } else {
    clickPercent = (rect.bottom - clientY) / rect.height
  }
  clickPercent = Math.max(0, Math.min(1, clickPercent))
  const rawVal = min + clickPercent * (max - min)
  return snapValueToStep(rawVal, min, max, step)
}

export interface TrackChoiceInput {
  values: number[]
  snapped: number
  min: number
  max: number
  step: number
  minStepsBetweenThumbs: number
  activeThumbIndex: number | null
}

export function chooseTrackThumb(input: TrackChoiceInput): number {
  const { values, snapped, min, max, step, minStepsBetweenThumbs, activeThumbIndex } = input
  let chosenIndex = 0
  if (values.length > 1) {
    const candidates: { index: number; dist: number; movable: boolean }[] = []
    for (let i = 0; i < values.length; i++) {
      const bounds = getThumbBounds(values, i, min, max, step, minStepsBetweenThumbs)
      const cur = values[i]
      let movable = false
      if (snapped > cur && cur < bounds.max) movable = true
      else if (snapped < cur && cur > bounds.min) movable = true
      else if (snapped === cur) movable = true

      candidates.push({
        index: i,
        dist: Math.abs(cur - snapped),
        movable,
      })
    }

    const movableCandidates = candidates.filter(c => c.movable)
    const pool = movableCandidates.length > 0 ? movableCandidates : candidates

    let minDist = Infinity
    for (const c of pool) {
      if (c.dist < minDist) minDist = c.dist
    }
    const closest = pool.filter(c => Math.abs(c.dist - minDist) < 1e-9)

    if (
      activeThumbIndex !== null &&
      closest.some(c => c.index === activeThumbIndex)
    ) {
      chosenIndex = activeThumbIndex
    } else {
      chosenIndex = closest[0].index
    }
  }
  return chosenIndex
}
