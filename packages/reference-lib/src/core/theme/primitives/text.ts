import { globalCss } from '@reference-ui/system'
import { baseTypography } from './baseTypography'

export const textPrimitiveStyles = {
  '.ref-blockquote': {
    ...baseTypography,
    fontSize: '4.5r',
    fontStyle: 'italic',
    lineHeight: '1.6',
    color: 'text.secondary',
    borderLeftWidth: '4px',
    borderLeftStyle: 'solid',
    borderLeftColor: 'text.secondary',
    paddingLeft: '1em',
    marginLeft: '0',
    marginRight: '0',
    marginTop: '0',
    marginBottom: '1em',
  },
  '.ref-cite': {
    ...baseTypography,
    fontStyle: 'italic',
    color: 'text.secondary',
  },
  '.ref-p': {
    ...baseTypography,
    fontSize: '4r',
    lineHeight: '1.6',
    marginTop: '0',
    marginBottom: '1em',
  },
  '.ref-small': {
    ...baseTypography,
    color: 'text.secondary',
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
