/**
 * @reference-ui/system entry
 * Build-time design system extension API (see system/fragments.md).
 */

export { tokens, keyframes, font, extendFont, globalCss, extendPattern } from '../system/api'
export { getRhythm } from '../system/panda/config/extensions/rhythm'
export type {
  ReferenceBoxPatternProps,
  ReferenceColorModeProps,
  ReferenceFontName,
  ReferenceFontProps,
  ReferenceFontRegistry,
  ReferenceFontWeightName,
  ReferenceFontWeightValue,
  ReferenceSystemStyleObject,
} from '../system/types'
