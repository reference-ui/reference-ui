/**
 * useSeparatorModel: what each Handle announces and whether it can act.
 * getSeparatorAria derives the value triple from the layout and constraint
 * table (safe pre-registration range until parts register); isHandleBlocked
 * layers explicit disabled plus the solver's infeasibility probe
 * (FEATURES #7: blocked handles stay focusable but inert). While a pointer
 * session is active both answers freeze at their pointerdown values — no
 * per-move ARIA writes even when the parent accepts every candidate.
 */
import * as React from 'react'
import {
  calculateSeparatorAriaValues,
  isHandleBlocked as probeHandleBlocked,
  type PanelConstraints,
} from '../math/splitter-math'
import type { RegisteredHandle, RegisteredPanel } from '../context'
import type { SplitterSeparatorAria } from '../types'
import { UNREGISTERED_SEPARATOR_ARIA } from '../shared/geometry'

export interface SessionFreeze {
  aria: SplitterSeparatorAria[]
  blocked: boolean[]
}

export interface SeparatorModelOptions {
  value: number[]
  panelConstraints: PanelConstraints[]
  isRtl: boolean
  partsRevision: number
  panelsRef: React.MutableRefObject<RegisteredPanel[]>
  handlesRef: React.MutableRefObject<RegisteredHandle[]>
  sessionFreezeRef: React.MutableRefObject<SessionFreeze | null>
}

export interface SeparatorModel {
  primaryPanelIndex: (handleIndex: number) => number
  getPanelId: (panelIndex: number) => string | undefined
  getSeparatorAria: (handleIndex: number) => SplitterSeparatorAria
  isHandleBlocked: (handleIndex: number, explicitDisabled: boolean) => boolean
}

export function useSeparatorModel(options: SeparatorModelOptions): SeparatorModel {
  const {
    value,
    panelConstraints,
    isRtl,
    partsRevision,
    panelsRef,
    handlesRef,
    sessionFreezeRef,
  } = options

  const primaryPanelIndex = React.useCallback(
    (handleIndex: number) => (isRtl ? handleIndex + 1 : handleIndex),
    [isRtl]
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getPanelId = React.useCallback(
    (panelIndex: number) => panelsRef.current[panelIndex]?.id,
    [partsRevision]
  )

  const getSeparatorAria = React.useCallback(
    (handleIndex: number) => {
      const frozen = sessionFreezeRef.current
      if (frozen && handleIndex >= 0 && handleIndex < frozen.aria.length) {
        return frozen.aria[handleIndex] ?? UNREGISTERED_SEPARATOR_ARIA
      }
      if (
        handleIndex < 0 ||
        handleIndex >= value.length - 1 ||
        panelConstraints.length !== value.length
      ) {
        return UNREGISTERED_SEPARATOR_ARIA
      }
      const aria = calculateSeparatorAriaValues({
        layout: value,
        panelConstraints,
        panelIndex: primaryPanelIndex(handleIndex),
      })
      return { valueNow: aria.valueNow, valueMin: aria.valueMin, valueMax: aria.valueMax }
    },
    [value, panelConstraints, primaryPanelIndex, sessionFreezeRef]
  )

  // FEATURES #7: explicit disabled plus solver-probed infeasibility.
  // Unregistered Handles (SSR, first render) report only their explicit
  // flag so server and client agree before measurement exists.
  const isHandleBlocked = React.useCallback(
    (handleIndex: number, explicitDisabled: boolean) => {
      const frozen = sessionFreezeRef.current
      if (frozen && handleIndex >= 0 && handleIndex < frozen.blocked.length) {
        return frozen.blocked[handleIndex] ?? true
      }
      if (
        handleIndex < 0 ||
        handlesRef.current.length !== value.length - 1 ||
        panelConstraints.length !== value.length
      ) {
        return explicitDisabled
      }
      if (explicitDisabled || handlesRef.current[handleIndex]?.disabled) return true
      return probeHandleBlocked({
        layout: value,
        panelConstraints,
        handleIndex,
      })
    },
    [value, panelConstraints, handlesRef, sessionFreezeRef]
  )

  return { primaryPanelIndex, getPanelId, getSeparatorAria, isHandleBlocked }
}
