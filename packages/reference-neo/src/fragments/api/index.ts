// Fragment author surface: the calls fragment files import from Neo.
// It takes nothing and re-exports the five collectors plus their shapes.
// This barrel is the bootstrap alias target for fragment execution.

export {
  tokens,
  createTokensCollector,
  type ReferenceTokenConfig,
  type ReferenceTokenLeaf,
  type TokenConfig,
} from './tokens.ts'
export { keyframes, createKeyframesCollector, type KeyframesConfig } from './keyframes.ts'
export {
  font,
  createFontCollector,
  type FontDefinition,
  type FontOptions,
  type FontFaceRule,
  type FontWeightName,
} from './font.ts'
export {
  globalCss,
  createGlobalCssCollector,
  type GlobalCssConfig,
  type GlobalCssRule,
} from './globalCss.ts'
export {
  extendPattern,
  createBoxPatternCollector,
  type BoxPatternExtension,
  type BoxPatternProperty,
} from './patterns.ts'
