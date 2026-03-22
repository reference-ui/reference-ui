/**
 * Extend Library fixture.
 * Exports baseSystem for downstream extends[] consumers.
 *
 * Run `ref sync` in extend-library before using.
 */
export { baseSystem } from '@reference-ui/system/baseSystem'
export { DemoComponent } from './components/DemoComponent.js'
export { LightDarkDemo } from './components/LightDarkDemo.js'
export {
  fixtureDemoBg,
  fixtureDemoText,
  fixtureDemoAccent,
  lightDarkDemoBgLight,
  lightDarkDemoBgDark,
  lightDarkDemoTextLight,
  lightDarkDemoTextDark,
  fixtureDemoBgRgb,
  fixtureDemoTextRgb,
  fixtureDemoAccentRgb,
  lightDarkDemoBgLightRgb,
  lightDarkDemoBgDarkRgb,
  lightDarkDemoTextLightRgb,
  lightDarkDemoTextDarkRgb,
} from './tokens.js'
