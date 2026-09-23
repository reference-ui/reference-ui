// Barrel for the Neo-owned fragments module.
// It takes nothing and re-exports author calls plus scan, bundle, and evaluation.
// Sync drives prepare and evaluate while fragment files import the author calls.

export {
  tokens,
  keyframes,
  font,
  globalCss,
  extendPattern,
  createTokensCollector,
  createKeyframesCollector,
  createFontCollector,
  createGlobalCssCollector,
  createBoxPatternCollector,
  type ReferenceTokenConfig,
  type ReferenceTokenLeaf,
  type TokenConfig,
  type KeyframesConfig,
  type FontDefinition,
  type FontOptions,
  type FontFaceRule,
  type FontWeightName,
  type GlobalCssConfig,
  type GlobalCssRule,
  type BoxPatternExtension,
  type BoxPatternProperty,
} from './api/index.ts'
export {
  getUpstreamFragments,
  scanFragmentFiles,
  scanFragmentFilesNative,
  getFragmentCollectors,
  prepareFragments,
  createPortableFragmentBundle,
  evaluateFragments,
  evaluatePreparedFragments,
  type PreparedFragments,
} from './base/index.ts'
export { getFragmentBootstrapImportMap } from './base/bootstrap-import-map.ts'
export type { FragmentScan, ScannedSource } from './lib/index.ts'
