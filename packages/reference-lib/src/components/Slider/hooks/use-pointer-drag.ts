/**
 * usePointerDrag: the owned-pointer drag session. Exactly one pointer owns a
 * session; window listeners (subscribed by the root effect) drive it so
 * drags survive leaving the track and viewport. startPointerDrag validates
 * the thumb census and track, focuses the target thumb, and either records
 * the grab offset (thumb press) or emits the click value (track press);
 * release reports exactly one onChangeEnd per changed session. Cardinality
 * changes cancel the session with no end report.
 */
import * as React from 'react'
import type { SliderOrientation } from '../types'
import { countMismatchMessage } from '../shared/registry'
import { valueToPercent } from '../math/slider-math'
import type { ThumbRegistry } from './use-thumb-registry'
import type { ValueRequest } from './use-value-request'

export interface PointerDragOptions {
  values: number[]
  min: number
  max: number
  orientation: SliderOrientation
  disabled: boolean
  isRtl: boolean
  trackRef: React.RefObject<HTMLDivElement | null>
  registry: ThumbRegistry
  valueApi: ValueRequest
  setDraggingIndex: React.Dispatch<React.SetStateAction<number | null>>
  setActiveThumbIndex: React.Dispatch<React.SetStateAction<number | null>>
  setFocusVisibleIndex: React.Dispatch<React.SetStateAction<number | null>>
}

export interface PointerDrag {
  startPointerDrag: (
    e: React.PointerEvent<HTMLDivElement>,
    targetIndex: number,
    fromThumb: boolean
  ) => void
  cancelPointerSession: () => void
  getActiveDragIndex: () => number | null
  isPointerActive: () => boolean
  handlePointerMove: (e: PointerEvent) => void
  handlePointerUp: (e: PointerEvent) => void
  handlePointerCancel: (e: PointerEvent) => void
}

export function usePointerDrag(options: PointerDragOptions): PointerDrag {
  const {
    values,
    min,
    max,
    orientation,
    disabled,
    isRtl,
    trackRef,
    registry,
    valueApi,
    setDraggingIndex,
    setActiveThumbIndex,
    setFocusVisibleIndex,
  } = options
  const { latestPropsRef, lastRequestedValueRef, requestThumbValue } = valueApi
  const { getThumbNode, getThumbCount } = registry

  // Owned-pointer session refs. Exactly one pointer owns a session; window
  // listeners drive it so drags survive leaving the track and viewport.
  const activePointerIdRef = React.useRef<number | null>(null)
  const activeDragIndexRef = React.useRef<number | null>(null)
  const sessionLengthRef = React.useRef<number | null>(null)
  const grabOffsetRef = React.useRef(0)
  const hasChangedInSessionRef = React.useRef(false)

  const cancelPointerSession = React.useCallback(() => {
    activePointerIdRef.current = null
    activeDragIndexRef.current = null
    sessionLengthRef.current = null
    hasChangedInSessionRef.current = false
    setDraggingIndex(null)
  }, [setDraggingIndex])

  const getActiveDragIndex = React.useCallback(() => activeDragIndexRef.current, [])
  const isPointerActive = React.useCallback(() => activePointerIdRef.current !== null, [])

  // Cardinality changes invalidate the active drag: the old release commits
  // nothing and later moves issue no stale request.
  React.useEffect(() => {
    if (
      sessionLengthRef.current !== null &&
      values.length !== sessionLengthRef.current
    ) {
      cancelPointerSession()
    }
  }, [values.length, cancelPointerSession])

  const computePointerPercent = React.useCallback(
    (clientX: number, clientY: number): number | null => {
      const trackEl = trackRef.current
      if (!trackEl) return null
      const rect = trackEl.getBoundingClientRect()
      const { orientation: currentOrientation } = latestPropsRef.current
      const isHoriz = currentOrientation === 'horizontal'
      if (isHoriz && rect.width === 0) return null
      if (!isHoriz && rect.height === 0) return null

      let percent: number
      if (isHoriz) {
        const adjustedX = clientX - grabOffsetRef.current
        percent = isRtl
          ? (rect.right - adjustedX) / rect.width
          : (adjustedX - rect.left) / rect.width
      } else {
        const adjustedY = clientY - grabOffsetRef.current
        percent = (rect.bottom - adjustedY) / rect.height
      }
      if (!Number.isFinite(percent)) return null
      return Math.max(0, Math.min(1, percent))
    },
    [isRtl]
  )

  const handlePointerMove = React.useCallback(
    (e: PointerEvent) => {
      if (activePointerIdRef.current === null || e.pointerId !== activePointerIdRef.current) {
        return
      }
      if (e.buttons === 0) {
        // Dropped mouseup / released touch contact: cancel, never commit.
        cancelPointerSession()
        return
      }

      const dragIndex = activeDragIndexRef.current
      const { values: curValues, min: curMin, max: curMax } = latestPropsRef.current
      if (dragIndex === null || dragIndex < 0 || dragIndex >= curValues.length) return

      const percent = computePointerPercent(e.clientX, e.clientY)
      if (percent === null) return
      const raw = curMin + percent * (curMax - curMin)
      if (requestThumbValue(dragIndex, raw)) {
        hasChangedInSessionRef.current = true
      }
    },
    [computePointerPercent, requestThumbValue, cancelPointerSession]
  )

  const handlePointerUp = React.useCallback(
    (e: PointerEvent) => {
      if (activePointerIdRef.current === null || e.pointerId !== activePointerIdRef.current) {
        return
      }
      const dragIndex = activeDragIndexRef.current
      const changed = hasChangedInSessionRef.current
      const lastRequested = lastRequestedValueRef.current
      cancelPointerSession()

      // Exactly one end per changed session, before capture cleanup.
      if (changed) {
        const { onChangeEnd: curOnChangeEnd } = latestPropsRef.current
        curOnChangeEnd?.(lastRequested)
      }

      if (dragIndex !== null) {
        getThumbNode(dragIndex)?.focus()
      }
    },
    [cancelPointerSession, getThumbNode]
  )

  const handlePointerCancel = React.useCallback(
    (e: PointerEvent) => {
      if (activePointerIdRef.current === null || e.pointerId !== activePointerIdRef.current) {
        return
      }
      cancelPointerSession()
    },
    [cancelPointerSession]
  )

  const startPointerDrag = React.useCallback(
    (
      e: React.PointerEvent<HTMLDivElement>,
      targetIndex: number,
      fromThumb: boolean
    ) => {
      if (disabled) return

      if (
        getThumbCount() !== values.length ||
        targetIndex < 0 ||
        targetIndex >= values.length
      ) {
        throw new Error(countMismatchMessage(values.length, getThumbCount()))
      }

      const trackEl = trackRef.current
      if (!trackEl) {
        throw new Error('[Slider] Slider requires a Slider.Track component')
      }

      activePointerIdRef.current = e.pointerId
      activeDragIndexRef.current = targetIndex
      sessionLengthRef.current = values.length
      setActiveThumbIndex(targetIndex)
      setDraggingIndex(targetIndex)
      setFocusVisibleIndex(null)
      hasChangedInSessionRef.current = false

      const thumbNode = getThumbNode(targetIndex)
      if (thumbNode && document.activeElement !== thumbNode) {
        thumbNode.focus()
      }

      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {}

      const rect = trackEl.getBoundingClientRect()
      const isHoriz = orientation === 'horizontal'
      const currentVal = values[targetIndex]
      const currentPercent = valueToPercent(currentVal, min, max)

      if (fromThumb) {
        let thumbCenter: number
        if (isHoriz) {
          thumbCenter = isRtl
            ? rect.right - (currentPercent / 100) * rect.width
            : rect.left + (currentPercent / 100) * rect.width
          grabOffsetRef.current = e.clientX - thumbCenter
        } else {
          thumbCenter = rect.bottom - (currentPercent / 100) * rect.height
          grabOffsetRef.current = e.clientY - thumbCenter
        }
        // Thumb presses never emit on their own; the session does.
      } else {
        grabOffsetRef.current = 0
        const percent = computePointerPercent(e.clientX, e.clientY)
        if (percent !== null) {
          const raw = min + percent * (max - min)
          if (requestThumbValue(targetIndex, raw)) {
            hasChangedInSessionRef.current = true
          }
        }
      }

      getThumbNode(targetIndex)?.focus()
    },
    [
      disabled,
      values,
      orientation,
      min,
      max,
      isRtl,
      computePointerPercent,
      requestThumbValue,
      getThumbNode,
    ]
  )

  return {
    startPointerDrag,
    cancelPointerSession,
    getActiveDragIndex,
    isPointerActive,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
  }
}
