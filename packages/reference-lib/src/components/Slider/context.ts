/**
 * Slider's private subtree scope: the context value the root publishes and
 * the parts consume. It carries the resolved configuration (values, bounds,
 * step, orientation, direction), the live interaction state (dragging, focus,
 * active thumb), the track/range/thumb registries, and the pointer, keyboard,
 * and focus handlers the parts invoke. Internal only — never re-exported.
 */
import * as React from 'react'
import type { SliderOrientation } from './types'

export interface SliderContextValue {
  values: number[]
  min: number
  max: number
  step: number
  minStepsBetweenThumbs: number
  orientation: SliderOrientation
  disabled: boolean
  isRtl: boolean
  draggingIndex: number | null
  focusVisibleIndex: number | null
  activeThumbIndex: number | null
  trackRef: React.RefObject<HTMLDivElement | null>
  registerTrack: (node: HTMLDivElement | null) => void
  registerRange: (node: HTMLDivElement | null) => void
  claimThumbId: () => number
  registerThumb: (id: number, node: HTMLDivElement | null) => void
  getThumbIndex: (id: number) => number
  startPointerDrag: (
    e: React.PointerEvent<HTMLDivElement>,
    targetIndex: number,
    fromThumb: boolean
  ) => void
  handleThumbKeyDown: (e: React.KeyboardEvent<HTMLDivElement>, index: number) => void
  handleThumbKeyUp: (e: React.KeyboardEvent<HTMLDivElement>, index: number) => void
  handleThumbFocus: (e: React.FocusEvent<HTMLDivElement>, index: number) => void
  handleThumbBlur: (e: React.FocusEvent<HTMLDivElement>, index: number) => void
  setFocusVisibleIndex: (index: number | null) => void
}

export const SliderContext = React.createContext<SliderContextValue | null>(null)
