/**
 * Extend Library fixture.
 * Exports baseSystem for downstream extends[] consumers.
 *
 * Run `ref sync` in extend-library before using.
 */
export { baseSystem } from '../.reference-ui/system/baseSystem.mjs'
export { DemoComponent } from './components/DemoComponent'
export { LightDarkDemo } from './components/LightDarkDemo'
export {
  fixtureDemoBg,
  fixtureDemoText,
  fixtureDemoAccent,
  fixtureDemoPrivateBrand,
  lightDarkDemoBgLight,
  lightDarkDemoBgDark,
  lightDarkDemoTextLight,
  lightDarkDemoTextDark,
  fixtureDemoBgRgb,
  fixtureDemoTextRgb,
  fixtureDemoAccentRgb,
  fixtureDemoPrivateBrandRgb,
  lightDarkDemoBgLightRgb,
  lightDarkDemoBgDarkRgb,
  lightDarkDemoTextLightRgb,
  lightDarkDemoTextDarkRgb,
} from './tokens'
