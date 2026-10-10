/**
 * useFieldFormatting: prop validation plus the Intl layer. Render-phase
 * checks fail fast on unusable numeric props, bad locale/format pairs,
 * non-invertible notations, and silently-fallen-back numbering systems;
 * the formatter, parse symbols, lattice bounds, clean display text,
 * display round-trip, and grammar-derived inputMode all derive from the
 * validated props. Pure derivation, no effects.
 */
import * as React from 'react'
import { parseDraftNumber } from '../draft/parse'
import { deriveInputMode } from '../draft/input-mode'
import { draftNumberSymbols, type DraftNumberSymbols } from '../draft/symbols'
import type { NumberFieldCommitBehavior } from '../types'

export interface FieldFormattingOptions {
  value: number | null
  locale: string
  min: number
  max: number
  stepProp: number | undefined
  formatOptions: Intl.NumberFormatOptions | undefined
  commitBehavior: NumberFieldCommitBehavior
}

export interface FieldFormatting {
  formatter: Intl.NumberFormat
  percentStyle: boolean
  notation: string | undefined
  groupingDisabled: boolean
  symbols: DraftNumberSymbols
  step: number
  latticeMin: number | undefined
  latticeMax: number | undefined
  displayValue: string
  displayRoundTrip: (candidate: number) => number
  managedInputMode: 'text' | 'decimal' | 'numeric'
}

export function useFieldFormatting(options: FieldFormattingOptions): FieldFormatting {
  const { value, locale, min, max, stepProp, formatOptions, commitBehavior } = options

  // Runtime validation of numeric props (NF-MATH-02, adapted): fail fast
  // on NaN/unusable props instead of poisoning state. Unlike quarantine,
  // ±Infinity bounds stay legal — they are this engine's unbounded
  // sentinels (the defaults). Render-phase pure checks: StrictMode-safe.
  // FEATURES #1: value is required-controlled (null is the empty value)
  // and locale is required with no environment default; there is no
  // defaultValue and no uncontrolled mode.
  if (value === undefined) {
    throw new Error(
      'Reference UI: NumberField "value" is required — the field is fully controlled, with null as the empty value.'
    )
  }
  if (value !== null && !Number.isFinite(value)) {
    throw new Error('Reference UI: NumberField "value" must be a finite number or null.')
  }
  if (locale == null) {
    throw new Error('Reference UI: NumberField "locale" is required — pass an explicit locale (no environment default).')
  }
  if (Number.isNaN(min)) {
    throw new Error('Reference UI: NumberField "min" must be a number.')
  }
  if (Number.isNaN(max)) {
    throw new Error('Reference UI: NumberField "max" must be a number.')
  }
  if (min > max) {
    throw new Error('Reference UI: NumberField "min" must be less than or equal to "max".')
  }
  if (commitBehavior !== 'snap' && commitBehavior !== 'validate' && commitBehavior !== 'none') {
    throw new Error('Reference UI: NumberField "commitBehavior" must be "snap", "validate", or "none".')
  }

  // W-25: the display formatter. Construction fails fast on a bad locale
  // or option pair (Intl RangeError/TypeError) with the props named.
  const formatter = React.useMemo(() => {
    try {
      return new Intl.NumberFormat(locale, formatOptions)
    } catch (error) {
      throw new Error(
        `Reference UI: NumberField "locale"/"formatOptions" are not a valid Intl.NumberFormat pair — ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }, [locale, formatOptions])
  const percentStyle = React.useMemo(
    () => formatter.resolvedOptions().style === 'percent',
    [formatter]
  )
  const notation = React.useMemo(() => formatter.resolvedOptions().notation, [formatter])
  // NF-PARSE-16: compact notation and hidden-sign display fail before
  // accepting edits — the editor cannot round-trip abbreviated or
  // signless output, so no fallback editor is offered.
  const resolvedFormat = formatter.resolvedOptions()
  if (resolvedFormat.notation === 'compact') {
    throw new Error(
      'Reference UI: NumberField "formatOptions" with compact notation is not editable — abbreviated output has no invertible grammar.'
    )
  }
  if (resolvedFormat.signDisplay === 'never') {
    throw new Error(
      'Reference UI: NumberField "formatOptions" with signDisplay "never" is not editable — negatives have no written form.'
    )
  }
  // The numberingSystem option falls back silently too (roman → latn) —
  // a refused request is a fallback editor, so it fails like the locale.
  if (
    formatOptions?.numberingSystem &&
    resolvedFormat.numberingSystem !== formatOptions.numberingSystem
  ) {
    throw new Error(
      `Reference UI: NumberField "formatOptions" requests numbering system "${formatOptions.numberingSystem}" but Intl resolves "${resolvedFormat.numberingSystem}" — this field is not editable.`
    )
  }
  // Parse symbols come from a default-grouping formatter so a grouped
  // paste still parses under useGrouping:false (NF-PARSE-07 direction) —
  // but with the display formatter's resolved numbering system, so the
  // parser accepts exactly the digits the field renders (NF-PARSE-02).
  const symbols = React.useMemo(
    () => draftNumberSymbols(locale, formatOptions),
    [locale, formatOptions]
  )

  // W-25: percent fields step hundredths by default (React Aria parity);
  // every other style keeps the historic step 1.
  const step = stepProp ?? (percentStyle ? 0.01 : 1)
  if (!Number.isFinite(step) || step <= 0) {
    throw new Error('Reference UI: NumberField "step" must be a finite number greater than 0.')
  }

  // W-02: the ±Infinity sentinels read as absent bounds to the lattice.
  const latticeMin = min === -Infinity ? undefined : min
  const latticeMax = max === Infinity ? undefined : max

  // W-25: clean-state text is the Intl formatting of the controlled
  // value; null is the only clean empty display (NF-FORMAT-02). A
  // programmatic -0 renders "0" (String parity — Intl would print "-0",
  // NF-MATH-14); interaction-produced -0 never reaches here.
  const displayValue = React.useMemo(() => {
    if (value === null) return ''
    return formatter.format(Object.is(value, -0) ? 0 : value)
  }, [formatter, value])

  // React Aria commit parity: authored display precision applies to the
  // committed number (format, then re-parse). Styles whose text cannot
  // round-trip through the modest parser (compact, units) keep the
  // pre-rounding candidate instead of failing the commit.
  const displayRoundTrip = React.useCallback(
    (candidate: number): number => {
      const reparsed = parseDraftNumber(formatter.format(candidate), symbols, percentStyle)
      return Number.isNaN(reparsed) ? candidate : reparsed
    },
    [formatter, symbols, percentStyle]
  )

  // Grammar-derived keyboard hint (NF-ENV-07): deterministic from
  // props/Intl, stable across SSR.
  const managedInputMode = React.useMemo(
    () =>
      deriveInputMode({
        commitBehavior,
        min,
        step,
        percentStyle,
        notation,
        formatOptions,
      }),
    [commitBehavior, min, step, percentStyle, notation, formatOptions]
  )

  const groupingDisabled = resolvedFormat.useGrouping === false

  return {
    formatter,
    percentStyle,
    notation,
    groupingDisabled,
    symbols,
    step,
    latticeMin,
    latticeMax,
    displayValue,
    displayRoundTrip,
    managedInputMode,
  }
}
