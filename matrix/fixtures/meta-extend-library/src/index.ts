/**
 * Meta-extend-library fixture.
 * Extends `@fixtures/extend-library`. Used to prove transitive `extends`
 * chains and shared-base diamond composition in the chain matrix.
 *
 * Run `ref sync` before using.
 */
export { baseSystem } from '../.reference-ui/system/baseSystem.mjs'
export { MetaExtendDemo } from './components/MetaExtendDemo'
export {
  metaExtendBg,
  metaExtendText,
  metaExtendBgRgb,
  metaExtendTextRgb,
} from './tokens'
