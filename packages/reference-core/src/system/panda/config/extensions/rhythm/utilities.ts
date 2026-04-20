/**
 * Rhythm spacing utilities: map token values to multiples of R via
 * `resolveRhythm` (e.g. "2r" → calc(2 * var(--spacing-r))).
 * Used by extendUtilities in the bundled extensions runtime.
 */

import { rhythmBorderRadiusUtilities } from './border'
import { resolveRhythm } from './helpers'
import { sizeStyles } from '../size/styles'

type RhythmTransform = {
  property: string
  values: 'spacing'
  transform: (value: unknown) => Record<string, string | number>
}

const rhythmTransform = (property: string): RhythmTransform => ({
  property,
  values: 'spacing' as const,
  transform: (value: unknown) => ({ [property]: resolveRhythm(value) }),
})

const rhythmSizeTransform: RhythmTransform = {
  property: 'size',
  values: 'spacing',
  transform: (value: unknown) => sizeStyles(resolveRhythm(value)),
}

export const rhythmUtilities = {
  width: rhythmTransform('width'),
  height: rhythmTransform('height'),
  size: rhythmSizeTransform,

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

  ...rhythmBorderRadiusUtilities,

  outlineOffset: rhythmTransform('outlineOffset'),
  borderSpacing: rhythmTransform('borderSpacing'),
}
