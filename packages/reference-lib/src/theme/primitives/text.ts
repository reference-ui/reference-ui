import { globalCss } from '@reference-ui/system'
import { baseTypography } from './baseTypography.js'

export const textPrimitiveStyles = {
  '.ref-blockquote': {
    ...baseTypography,
    fontSize: '4.5r',
    fontStyle: 'italic',
    lineHeight: '1.6',
    color: 'gray.600',
    borderLeftWidth: '4px',
    borderLeftStyle: 'solid',
    borderLeftColor: 'gray.300',
    paddingLeft: '1em',
    marginLeft: '0',
    marginRight: '0',
    marginTop: '0',
    marginBottom: '1em',
  },
  '.ref-cite': {
    ...baseTypography,
    fontStyle: 'italic',
    color: 'gray.500',
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
