import type { SystemProperties } from '../system/types/style-props'

/**
 * Returns a CSS calc value for the given rhythm units.
 * Use in token configs and wherever you need rhythm values programmatically.
 *
 * @param n - Number of rhythm units (e.g. 0.5, 2, 3)
 * @returns CSS value string, e.g. `calc(0.5 * var(--spacing-r))`
 *
 * @example
 * getRhythm(0.5)   // calc(0.5 * var(--spacing-r))
 * getRhythm(2)     // calc(2 * var(--spacing-r))
 * getRhythm(1, 3)  // calc(var(--spacing-r) / 3) – for 1/3r
 */
export function getRhythm(n: number): string
export function getRhythm(num: number, denom: number): string
export function getRhythm(num: number, denom?: number): string {
  if (denom !== undefined) {
    return num === 1
      ? `calc(var(--spacing-r) / ${denom})`
      : `calc(${num} * var(--spacing-r) / ${denom})`
  }
  if (num === 1) return 'var(--spacing-r)'
  return `calc(${num} * var(--spacing-r))`
}

type UtilityTransform<P extends keyof SystemProperties = keyof SystemProperties> = {
  readonly property: P
  readonly values: 'spacing'
  readonly transform: (value: unknown) => Record<P, string | number>
}

function resolveRhythm(value: unknown): string | number {
  if (typeof value === 'string' && value.endsWith('r')) {
    const n = Number(value.slice(0, -1))
    if (!Number.isNaN(n)) {
      return `calc(${n} * var(--spacing-r))`
    }
  }
  return value as string | number
}


const rhythmTransform = <P extends keyof SystemProperties>(property: P): UtilityTransform<P> => ({
  property,
  values: 'spacing' as const,
  transform: (value: unknown) => ({
    [property]: resolveRhythm(value),
  }) as Record<P, string | number>,
})

export const rhythmUtilities = {

  width: rhythmTransform('width'),
  height: rhythmTransform('height'),

  fontSize: rhythmTransform('fontSize'),
  lineHeight: rhythmTransform('lineHeight'),
  letterSpacing: rhythmTransform('letterSpacing'),


  padding: rhythmTransform('padding'),
  paddingTop: rhythmTransform('paddingTop'),
  paddingBottom: rhythmTransform('paddingBottom'),
  paddingLeft: rhythmTransform('paddingLeft'),
  paddingRight: rhythmTransform('paddingRight'),
  paddingInline: rhythmTransform('paddingInline'),
  paddingInlineStart: rhythmTransform('paddingInlineStart'),
  paddingInlineEnd: rhythmTransform('paddingInlineEnd'),
  paddingBlock: rhythmTransform('paddingBlock'),
  paddingBlockStart: rhythmTransform('paddingBlockStart'),
  paddingBlockEnd: rhythmTransform('paddingBlockEnd'),

  margin: rhythmTransform('margin'),
  marginTop: rhythmTransform('marginTop'),
  marginBottom: rhythmTransform('marginBottom'),
  marginLeft: rhythmTransform('marginLeft'),
  marginRight: rhythmTransform('marginRight'),
  marginInline: rhythmTransform('marginInline'),
  marginInlineStart: rhythmTransform('marginInlineStart'),
  marginInlineEnd: rhythmTransform('marginInlineEnd'),
  marginBlock: rhythmTransform('marginBlock'),
  marginBlockStart: rhythmTransform('marginBlockStart'),
  marginBlockEnd: rhythmTransform('marginBlockEnd'),

  gap: rhythmTransform('gap'),
  rowGap: rhythmTransform('rowGap'),
  columnGap: rhythmTransform('columnGap'),
  gridGap: rhythmTransform('gridGap'),
  gridRowGap: rhythmTransform('gridRowGap'),
  gridColumnGap: rhythmTransform('gridColumnGap'),

  inset: rhythmTransform('inset'),
  insetBlock: rhythmTransform('insetBlock'),
  insetBlockStart: rhythmTransform('insetBlockStart'),
  insetBlockEnd: rhythmTransform('insetBlockEnd'),
  insetInline: rhythmTransform('insetInline'),
  insetInlineStart: rhythmTransform('insetInlineStart'),
  insetInlineEnd: rhythmTransform('insetInlineEnd'),
  top: rhythmTransform('top'),
  right: rhythmTransform('right'),
  bottom: rhythmTransform('bottom'),
  left: rhythmTransform('left'),

  scrollMargin: rhythmTransform('scrollMargin'),
  scrollMarginTop: rhythmTransform('scrollMarginTop'),
  scrollMarginRight: rhythmTransform('scrollMarginRight'),
  scrollMarginBottom: rhythmTransform('scrollMarginBottom'),
  scrollMarginLeft: rhythmTransform('scrollMarginLeft'),
  scrollMarginBlock: rhythmTransform('scrollMarginBlock'),
  scrollMarginBlockStart: rhythmTransform('scrollMarginBlockStart'),
  scrollMarginBlockEnd: rhythmTransform('scrollMarginBlockEnd'),
  scrollMarginInline: rhythmTransform('scrollMarginInline'),
  scrollMarginInlineStart: rhythmTransform('scrollMarginInlineStart'),
  scrollMarginInlineEnd: rhythmTransform('scrollMarginInlineEnd'),

  scrollPadding: rhythmTransform('scrollPadding'),
  scrollPaddingTop: rhythmTransform('scrollPaddingTop'),
  scrollPaddingRight: rhythmTransform('scrollPaddingRight'),
  scrollPaddingBottom: rhythmTransform('scrollPaddingBottom'),
  scrollPaddingLeft: rhythmTransform('scrollPaddingLeft'),
  scrollPaddingBlock: rhythmTransform('scrollPaddingBlock'),
  scrollPaddingBlockStart: rhythmTransform('scrollPaddingBlockStart'),
  scrollPaddingBlockEnd: rhythmTransform('scrollPaddingBlockEnd'),
  scrollPaddingInline: rhythmTransform('scrollPaddingInline'),
  scrollPaddingInlineStart: rhythmTransform('scrollPaddingInlineStart'),
  scrollPaddingInlineEnd: rhythmTransform('scrollPaddingInlineEnd'),

  outlineOffset: rhythmTransform('outlineOffset'),
  borderSpacing: rhythmTransform('borderSpacing'),
} satisfies { [K in keyof SystemProperties]?: UtilityTransform<K> }
