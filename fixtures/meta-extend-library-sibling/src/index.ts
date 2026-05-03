/**
 * Meta-extend-library-sibling fixture.
 *
 * Sibling of `@fixtures/meta-extend-library`. Both extend
 * `@fixtures/extend-library`, used together to model diamond / shared-base
 * composition (T7, T17).
 */
export { baseSystem } from '../.reference-ui/system/baseSystem.mjs'
export { MetaSiblingDemo } from './components/MetaSiblingDemo'
export {
  metaSiblingBg,
  metaSiblingText,
  metaSiblingBgRgb,
  metaSiblingTextRgb,
} from './tokens'
