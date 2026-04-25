import { globalCss } from '@reference-ui/system'
import { baseTypography } from './baseTypography'
import { blockText } from '../shared'

export const listPrimitiveStyles = {
  '.ref-ul, .ref-ol, .ref-menu': {
    ...blockText,
    paddingLeft: '4r',
    marginTop: '0',
    marginBottom: '4r',
    marginLeft: '0',
    listStylePosition: 'outside',
  },

  '.ref-ul, .ref-menu': {
    listStyleType: 'disc',
  },

  '.ref-ol': {
    listStyleType: 'decimal',
  },

  '.ref-li': {
    ...baseTypography,
    marginTop: '1r',
    paddingLeft: '2.5r',
  },

  '.ref-ul ::marker, .ref-menu ::marker': {
    color: '{colors.ui.mutedForeground}',
  },

  '.ref-ol ::marker': {
    color: '{colors.ui.mutedForeground}',
    fontWeight: '500',
  },

  '.ref-dl': {
    ...blockText,
    marginTop: '0',
    marginBottom: '4r',
  },

  '.ref-dt': {
    ...baseTypography,
    fontWeight: '600',
    marginTop: '3r',
  },

  '.ref-dd': {
    ...baseTypography,
    color: '{colors.ui.mutedForeground}',
    marginLeft: '0',
    marginTop: '1r',
  },
} as const

globalCss(listPrimitiveStyles)
