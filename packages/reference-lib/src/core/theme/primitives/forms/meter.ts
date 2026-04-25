import { globalCss } from '@reference-ui/system'
import { trackBackground } from '../shared'

const blue600 = '{colors.blue.600}'

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
    accentColor: blue600,
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

  '.ref-meter::-webkit-meter-optimum-value, .ref-meter::-webkit-meter-suboptimum-value, .ref-meter::-webkit-meter-even-less-good-value':
    {
      background: blue600,
      backgroundColor: blue600,
      backgroundImage: 'none',
      borderRadius: 'full',
      boxShadow: 'none',
    },

  '.ref-meter::-moz-meter-bar': {
    background: blue600,
    borderRadius: 'full',
  },
} as const

globalCss(meterPrimitiveStyles)
