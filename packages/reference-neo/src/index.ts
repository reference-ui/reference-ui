// Public surface: the one entry behind the @reference-ui/neo id.
// It takes nothing and re-exports the config plus the collector calls authors touch.
// Bundlers alias the id here and tsconfig paths point typechecking at the
// same file, so every resolver agrees on what authors can import.
export { defineConfig, type ReferenceUIConfig } from './config/types.ts'
export { type BaseSystem } from './system/base/types.ts'
export {
  tokens,
  type ReferenceTokenConfig,
  type ReferenceTokenLeaf,
  type TokenConfig,
} from './collect/surface/index.ts'
export { keyframes, type KeyframesConfig } from './collect/surface/index.ts'
export {
  font,
  type FontDefinition,
  type FontOptions,
  type FontFaceRule,
  type FontWeightName,
} from './collect/surface/index.ts'
export {
  globalCss,
  type GlobalCssConfig,
  type GlobalCssRule,
} from './collect/surface/index.ts'
export { recipe, type RecipeConfig } from './collect/surface/index.ts'
