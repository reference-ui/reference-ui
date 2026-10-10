/**
 * Splitter's subtree scopes: the root context the parts register against
 * (orientation, controlled value, DOM-order part registries, separator
 * model, session cancels, and the pointer/keyboard entry points) plus the
 * handle context each Handle publishes for its Thumb chrome. The root
 * context stays internal; the handle context is public and re-exported.
 */
import * as React from 'react'
import type { PanelConstraints } from './math/splitter-math'
import type {
  SplitterHandleContextValue,
  SplitterOrientation,
  SplitterSeparatorAria,
} from './types'

export interface RegisteredPanel {
  key: string
  id: string
  element: HTMLDivElement | null
  min: number | string | undefined
  max: number | string | undefined
  collapsible: boolean
  collapsedSize: number
}

export interface RegisteredHandle {
  key: string
  element: HTMLDivElement | null
  disabled: boolean
}

export interface SplitterContextValue {
  orientation: SplitterOrientation
  value: number[]
  isRtl: boolean
  isResizing: boolean
  resizingHandleIndex: number | null
  panelConstraints: PanelConstraints[]
  primaryPanelIndex: (handleIndex: number) => number
  getPanelId: (panelIndex: number) => string | undefined
  getPanelIndex: (key: string) => number
  getHandleIndex: (key: string) => number
  registerPanel: (panel: RegisteredPanel) => () => void
  registerHandle: (handle: RegisteredHandle) => () => void
  getSeparatorAria: (handleIndex: number) => SplitterSeparatorAria
  isHandleBlocked: (handleIndex: number, explicitDisabled: boolean) => boolean
  cancelOwnedSession: (handleIndex: number) => void
  cancelKeyboardSession: (handleIndex: number) => void
  onHandlePointerDown: (handleIndex: number, e: React.PointerEvent<HTMLDivElement>) => void
  onHandleKeyDown: (handleIndex: number, e: React.KeyboardEvent<HTMLDivElement>) => void
  onHandleKeyUp: () => void
}

export const SplitterContext = React.createContext<SplitterContextValue | null>(null)

export const SplitterHandleContext = React.createContext<SplitterHandleContextValue | null>(null)
