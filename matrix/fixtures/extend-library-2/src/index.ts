/**
 * Extend Library #2 fixture. Independent of `@fixtures/extend-library`.
 * Proves parallel `extends[]` directly (T9) and parallel chains through
 * `@fixtures/meta-extend-library-2` (T11, T13).
 */
export { baseSystem } from '../.reference-ui/system/baseSystem.mjs'
export { SecondaryDemoComponent } from './components/SecondaryDemoComponent'
export {
  secondaryDemoBg,
  secondaryDemoText,
  secondaryDemoAccent,
  secondaryDemoBgRgb,
  secondaryDemoTextRgb,
  secondaryDemoAccentRgb,
} from './tokens'
