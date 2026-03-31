/**
 * Layer Library fixture.
 * Exports baseSystem for downstream layers[] consumers.
 *
 * Run `ref sync` in layer-library before using.
 */
export { baseSystem } from '@reference-ui/system/baseSystem'
export { LightDarkDemo } from './components/LightDarkDemo'
export { LayerPrivateDemo } from './components/LayerPrivateDemo'
export {
  lightDarkDemoBgLight,
  lightDarkDemoBgDark,
  lightDarkDemoTextLight,
  lightDarkDemoTextDark,
  lightDarkDemoBgLightRgb,
  lightDarkDemoBgDarkRgb,
  lightDarkDemoTextLightRgb,
  lightDarkDemoTextDarkRgb,
  layerPrivateAccent,
  layerPrivateAccentRgb,
} from './tokens'
