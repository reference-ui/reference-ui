import { globalCss } from '@reference-ui/system'
import { trackBackground } from '../shared'

export const meterPrimitiveStyles = {
  '.ref-progress': {
    appearance: 'none',
    colorScheme: 'dark',
    display: 'block',
    width: '100%',
    height: '1.5r',
    borderWidth: '0',
    borderRadius: 'full',
    overflow: 'hidden',
    backgroundColor: trackBackground,
    accentColor: '{colors.ui.progress.bar.foreground}',
  },

  '.ref-progress::-webkit-progress-bar': {
    backgroundColor: trackBackground,
    borderRadius: 'full',
  },

  '.ref-progress::-webkit-progress-value': {
    backgroundColor: '{colors.ui.progress.bar.foreground}',
    borderRadius: 'full',
  },

  '.ref-progress::-moz-progress-bar': {
    backgroundColor: '{colors.ui.progress.bar.foreground}',
    borderRadius: 'full',
  },

  '.ref-meter': {
    WebkitAppearance: 'none',
    appearance: 'none',
    display: 'block',
    width: '100%',
    height: '1.5r',
    accentColor: '{colors.ui.meter.optimum.foreground}',
    borderWidth: '0',
    borderRadius: 'full',
    backgroundColor: trackBackground,
    overflow: 'hidden',
  },

  '.ref-meter::-webkit-meter-bar': {
    WebkitAppearance: 'none',
    height: '1.5r',
    borderWidth: '0',
    borderRadius: 'full',
    background: trackBackground,
    backgroundColor: trackBackground,
    backgroundImage: 'none',
    boxShadow: 'none',
  },

  '.ref-meter::-webkit-meter-optimum-value': {
    background: '{colors.ui.meter.optimum.foreground}',
    backgroundColor: '{colors.ui.meter.optimum.foreground}',
    backgroundImage: 'none',
    borderRadius: 'full',
    boxShadow: 'none',
  },

  '.ref-meter::-webkit-meter-suboptimum-value': {
    background: '{colors.ui.meter.suboptimum.foreground}',
    backgroundColor: '{colors.ui.meter.suboptimum.foreground}',
    backgroundImage: 'none',
    borderRadius: 'full',
    boxShadow: 'none',
  },

  '.ref-meter::-webkit-meter-even-less-good-value': {
    background: '{colors.ui.meter.evenLessGood.foreground}',
    backgroundColor: '{colors.ui.meter.evenLessGood.foreground}',
    backgroundImage: 'none',
    borderRadius: 'full',
    boxShadow: 'none',
  },

  '.ref-meter:-moz-meter-optimum::-moz-meter-bar': {
    background: '{colors.ui.meter.optimum.foreground}',
    borderRadius: 'full',
  },

  '.ref-meter:-moz-meter-sub-optimum::-moz-meter-bar': {
    background: '{colors.ui.meter.suboptimum.foreground}',
    borderRadius: 'full',
  },

  '.ref-meter:-moz-meter-sub-sub-optimum::-moz-meter-bar': {
    background: '{colors.ui.meter.evenLessGood.foreground}',
    borderRadius: 'full',
  },
} as const

globalCss(meterPrimitiveStyles)
