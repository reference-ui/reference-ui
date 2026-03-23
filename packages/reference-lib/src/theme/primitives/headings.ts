import { globalCss } from '@reference-ui/system'
import { baseTypography } from './baseTypography'

export const headingPrimitiveStyles = {
  '.ref-h1': {
    ...baseTypography,
    fontSize: '9r',
    fontWeight: 'bold',
    lineHeight: '15r',
    marginTop: '0',
    marginBottom: '3r',
  },
  '.ref-h2': {
    ...baseTypography,
    fontSize: '6r',
    fontWeight: 'bold',
    lineHeight: '10r',
    marginTop: '0',
    marginBottom: '3r',
  },
  '.ref-h3': {
    ...baseTypography,
    fontSize: '5r',
    fontWeight: 'bold',
    lineHeight: '10r',
    marginTop: '0',
    marginBottom: '3r',
  },
  '.ref-h4': {
    ...baseTypography,
    fontSize: '4.5r',
    fontWeight: 'bold',
    lineHeight: '8r',
    marginTop: '0',
    marginBottom: '3r',
  },
  '.ref-h5': {
    ...baseTypography,
    fontSize: '4.5r',
    fontWeight: '500',
    lineHeight: '8r',
    marginTop: '0',
    marginBottom: '3r',
  },
  '.ref-h6': {
    ...baseTypography,
    fontSize: '3.5r',
    fontWeight: '600',
    lineHeight: '8r',
    textTransform: 'uppercase',
    marginTop: '0',
    marginBottom: '3r',
  },
} as const

globalCss(headingPrimitiveStyles)
