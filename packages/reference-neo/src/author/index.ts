// Author surface: the one entry behind the @reference-ui/neo id.
// It takes nothing and re-exports the config and fragment-collector calls.
// Bundlers alias the id here and tsconfig paths point typechecking at the
// same file, so every resolver agrees on what authors can import.
export { defineConfig, type BaseSystem, type ReferenceUIConfig } from '../config/types.ts'
export {
  tokens,
  createTokensCollector,
  type ReferenceTokenConfig,
  type ReferenceTokenLeaf,
  type TokenConfig,
} from '../fragments/api/index.ts'
export { keyframes, createKeyframesCollector, type KeyframesConfig } from '../fragments/api/index.ts'
export {
  font,
  createFontCollector,
  type FontDefinition,
  type FontOptions,
  type FontFaceRule,
  type FontWeightName,
} from '../fragments/api/index.ts'
export {
  globalCss,
  createGlobalCssCollector,
  type GlobalCssConfig,
  type GlobalCssRule,
} from '../fragments/api/index.ts'
export {
  extendPattern,
  createBoxPatternCollector,
  type BoxPatternExtension,
  type BoxPatternProperty,
} from '../fragments/api/index.ts'
