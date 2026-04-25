import { globalCss } from '@reference-ui/system'
import { baseTypography } from './typography/baseTypography'
import { blockText } from './shared'

export const disclosurePrimitiveStyles = {
  '.ref-details': {
    ...blockText,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '{colors.ui.disclosure.border}',
    borderRadius: 'md',
    padding: '4r',
    marginBottom: '4r',
  },

  '.ref-summary': {
    ...baseTypography,
    cursor: 'pointer',
    fontWeight: '500',
  },

  '.ref-summary::marker': {
    marginRight: '2r',
  },
  '.ref-summary::-webkit-details-marker': {
    marginRight: '2r',
  },
} as const

globalCss(disclosurePrimitiveStyles)
