// Barrel for the Neo-owned collect subsystem.
// It takes nothing and re-exports author calls plus scan, bundle, and evaluation.
// Sync drives prepare and evaluate while fragment files import the author calls.

export {
  tokens,
  keyframes,
  font,
  globalCss,
  createTokensCollector,
  createKeyframesCollector,
  createFontCollector,
  createGlobalCssCollector,
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
} from './surface/index.ts'
export {
  getUpstreamFragments,
  scanFragmentFiles,
  scanFragmentFilesNative,
  getFragmentCollectors,
  prepareFragments,
  evaluateFragments,
  evaluatePreparedFragments,
  type PreparedFragments,
} from './lib/evaluate.ts'
export { getFragmentBootstrapImportMap } from './lib/bootstrap.ts'
export type { FragmentScan, ScannedSource } from './lib/scan/scanner.ts'
