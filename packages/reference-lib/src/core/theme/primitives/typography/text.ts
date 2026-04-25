import { globalCss } from '@reference-ui/system'
import { baseTypography } from './baseTypography'

export const textPrimitiveStyles = {
  '.ref-blockquote': {
    ...baseTypography,
    fontSize: '4.5r',
    fontStyle: 'italic',
    lineHeight: '1.6',
    color: '{colors.ui.mutedForeground}',
    borderLeftWidth: '4px',
    borderLeftStyle: 'solid',
    borderLeftColor: '{colors.ui.quoteBorder}',
    paddingLeft: '4r',
    marginLeft: '0',
    marginRight: '0',
    marginTop: '0',
    marginBottom: '4r',
  },
  '.ref-cite': {
    ...baseTypography,
    fontStyle: 'italic',
    color: '{colors.ui.mutedForeground}',
  },
  '.ref-p': {
    ...baseTypography,
    fontSize: '4r',
    lineHeight: '1.6',
    marginTop: '0',
    marginBottom: '4r',
  },
  '.ref-small': {
    ...baseTypography,
    color: '{colors.ui.mutedForeground}',
    fontSize: 'small',
    lineHeight: '1.4',
  },
  '.ref-sub': {
    ...baseTypography,
    fontSize: '0.75em',
    verticalAlign: 'sub',
    lineHeight: '0',
  },
  '.ref-sup': {
    ...baseTypography,
    fontSize: '0.75em',
    verticalAlign: 'super',
    lineHeight: '0',
  },
} as const

globalCss(textPrimitiveStyles)
