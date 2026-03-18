/**
 * System API — the public surface for @reference-ui/system.
 * Fragment functions are collected during config generation and merged into panda.config.
 */

export {
  tokens,
  createTokensCollector,
  type ReferenceTokenConfig,
  type ReferenceTokenLeaf,
  type TokenConfig,
} from './tokens'
export { keyframes, createKeyframesCollector, type KeyframesConfig } from './keyframes'
export {
  font,
  extendFont,
  createFontCollector,
  type FontDefinition,
  type FontOptions,
  type FontFaceRule,
  type FontWeightName,
} from './font'
export {
  globalCss,
  createGlobalCssCollector,
  type GlobalCssConfig,
} from './globalCss'
export {
  extendPattern,
  createBoxPatternCollector,
  type BoxPatternExtension,
  type BoxPatternProperty,
} from './patterns'
