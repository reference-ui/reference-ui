/**
 * Fragment collectors — the layer that extends Panda config.
 * These are distinct from the api/ layer: tokens, recipe, globalCss, etc.
 * use extendPandaConfig; extendPattern and extendFont are collectors for box pattern
 * and font definitions respectively.
 */

export {
  extendPandaConfig,
  createPandaConfigCollector,
  COLLECTOR_KEY,
} from './extendPandaConfig'
export {
  extendPattern,
  createBoxPatternCollector,
  type BoxPatternExtension,
} from './extendPattern'
export {
  extendFont,
  createFontCollector,
  type FontDefinition,
  type FontFaceRule,
} from './extendFont'
