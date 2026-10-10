/**
 * useKeyboardResize: arrow-key resizing plus Enter collapse/restore.
 * Arrows move 1% (10% with Shift) in the visual direction, Home/End jump
 * to the neighbor edge, and Enter toggles the primary panel between its
 * collapsed size and the newest remembered expanded size. Repeats share
 * one session that reports a single onChangeEnd on keyup; blur and
 * disable cancel it silently.
 */
import * as React from 'react'
import {
  adjustLayoutByDelta,
  layoutNumbersEqual,
  type PanelConstraints,
} from '../math/splitter-math'
import type { RegisteredHandle, RegisteredPanel } from '../context'
import type { SplitterOrientation } from '../types'

export interface KeyboardResizeOptions {
  value: number[]
  panelConstraints: PanelConstraints[]
  orientation: SplitterOrientation
  isRtl: boolean
  onChange: ((value: number[]) => void) | undefined
  latestRef: React.MutableRefObject<{
    value: number[]
    onChange: ((value: number[]) => void) | undefined
    onChangeEnd: ((value: number[]) => void) | undefined
  }>
  panelsRef: React.MutableRefObject<RegisteredPanel[]>
  handlesRef: React.MutableRefObject<RegisteredHandle[]>
  rememberedSizesRef: React.MutableRefObject<Map<string, number>>
  primaryPanelIndex: (handleIndex: number) => number
  isHandleBlocked: (handleIndex: number, explicitDisabled: boolean) => boolean
}

export interface KeyboardResize {
  cancelKeyboardSession: (handleIndex: number) => void
  onHandleKeyDown: (handleIndex: number, e: React.KeyboardEvent<HTMLDivElement>) => void
  onHandleKeyUp: () => void
}

export function useKeyboardResize(options: KeyboardResizeOptions): KeyboardResize {
  const {
    value,
    panelConstraints,
    orientation,
    isRtl,
    onChange,
    latestRef,
    panelsRef,
    handlesRef,
    rememberedSizesRef,
    primaryPanelIndex,
    isHandleBlocked,
  } = options

  const keyboardSessionRef = React.useRef<{
    handleIndex: number
    hasInteracted: boolean
    lastLayout: number[]
  }>({ handleIndex: -1, hasInteracted: false, lastLayout: [] })

  const cancelKeyboardSession = React.useCallback((handleIndex: number) => {
    if (keyboardSessionRef.current.handleIndex === handleIndex) {
      keyboardSessionRef.current.hasInteracted = false
    }
  }, [])

  const onHandleKeyDown = React.useCallback(
    (handleIndex: number, e: React.KeyboardEvent<HTMLDivElement>) => {
      if (handleIndex < 0 || handleIndex >= value.length - 1) return
      // Blocked Handles consume nothing: no preventDefault, no callback.
      if (isHandleBlocked(handleIndex, handlesRef.current[handleIndex]?.disabled ?? false)) {
        return
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return

      const isHorizontal = orientation === 'horizontal'
      const step = e.shiftKey ? 10 : 1
      let delta = 0
      let handled = false

      if (isHorizontal) {
        if (e.key === 'ArrowRight') {
          handled = true
          delta = isRtl ? -step : step
        } else if (e.key === 'ArrowLeft') {
          handled = true
          delta = isRtl ? step : -step
        }
      } else {
        if (e.key === 'ArrowDown') {
          handled = true
          delta = step
        } else if (e.key === 'ArrowUp') {
          handled = true
          delta = -step
        }
      }

      if (e.key === 'Home') {
        handled = true
        delta = -(value[handleIndex] ?? 50)
      } else if (e.key === 'End') {
        handled = true
        delta = value[handleIndex + 1] ?? 50
      } else if (e.key === 'Enter') {
        const primary = primaryPanelIndex(handleIndex)
        const constraints = panelConstraints[primary]
        const primaryId = panelsRef.current[primary]?.id
        if (constraints?.collapsible && primaryId !== undefined) {
          handled = true
          const currentSize = value[primary] ?? 50
          const collapsedSize = constraints.collapsedSize ?? 0
          const minSize = constraints.minSize ?? 0
          let targetSize: number
          if (layoutNumbersEqual(currentSize, collapsedSize)) {
            const remembered = rememberedSizesRef.current.get(primaryId)
            targetSize = Math.max(minSize, remembered ?? minSize)
          } else {
            rememberedSizesRef.current.set(primaryId, currentSize)
            targetSize = collapsedSize
          }
          delta = isRtl ? currentSize - targetSize : targetSize - currentSize
        }
      }

      if (!handled) return
      e.preventDefault()

      const nextLayout = adjustLayoutByDelta({
        delta,
        initialLayout: value,
        panelConstraints,
        pivotIndices: [handleIndex, handleIndex + 1],
        prevLayout: value,
        trigger: 'keyboard',
      })
      const hasChanged = nextLayout.some(
        (entry, entryIndex) => !layoutNumbersEqual(entry, value[entryIndex] ?? 0)
      )
      if (!hasChanged) return
      keyboardSessionRef.current = { handleIndex, hasInteracted: true, lastLayout: nextLayout }
      onChange?.(nextLayout)
    },
    [
      handlesRef,
      isHandleBlocked,
      isRtl,
      onChange,
      orientation,
      panelConstraints,
      panelsRef,
      primaryPanelIndex,
      rememberedSizesRef,
      value,
    ]
  )

  const onHandleKeyUp = React.useCallback(() => {
    if (keyboardSessionRef.current.hasInteracted) {
      keyboardSessionRef.current.hasInteracted = false
      latestRef.current.onChangeEnd?.(keyboardSessionRef.current.lastLayout)
    }
  }, [latestRef])

  return { cancelKeyboardSession, onHandleKeyDown, onHandleKeyUp }
}
