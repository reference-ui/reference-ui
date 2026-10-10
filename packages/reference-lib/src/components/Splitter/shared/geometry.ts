/**
 * The frozen geometry contract (FEATURES #4): panels size from their own
 * variable, the root publishes indexed variables in panel order for
 * consumer CSS, and the kernel never writes inline flex-basis/width or
 * grid-template-* as a competing signal. This module owns the variable
 * names, the default bound floor, the pre-registration separator ARIA,
 * and the small numeric/inline-style sanitizers both parts and hooks use.
 */
import type { SplitterSeparatorAria } from '../types'

// Decided resize floor (FEATURES #10: KEEP 5%): an unconstrained Panel
// clamps to >= 5% under drag/keys. Pinned by the SP-DOM-03 CT slices.
export const DEFAULT_PANEL_MIN_SIZE = 5
export const DEFAULT_PANEL_MAX_SIZE = 100

// FEATURES #4: the frozen geometry contract. Panels size from their own
// variable; Root publishes indexed variables in Panel order for consumer
// CSS. The kernel never writes inline flex-basis/width or grid-template-*
// as a competing signal.
export const PANEL_SIZE_VAR = '--reference-splitter-panel-size'
export const PANEL_FLEX = `1 1 var(${PANEL_SIZE_VAR})`
export function rootSizeVar(panelIndex: number): string {
  return `--reference-splitter-${panelIndex + 1}`
}

// Pre-registration Handle ARIA: order is unknown on the server and on the
// first client render, so separators render this safe range until layout
// effects register them (before paint on the client).
export const UNREGISTERED_SEPARATOR_ARIA: SplitterSeparatorAria = {
  valueNow: 50,
  valueMin: 0,
  valueMax: 100,
}

export function sanitizeBoundNumber(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback
}

// Restore a document-locked inline property: remove when it was absent so
// no empty declaration lingers for the next reader.
export function restoreInline(style: CSSStyleDeclaration, property: string, original: string): void {
  if (original) style.setProperty(property, original)
  else style.removeProperty(property)
}
