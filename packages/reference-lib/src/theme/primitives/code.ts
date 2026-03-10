import { globalCss } from '@reference-ui/system'
import { baseTypography } from './baseTypography.js'

export const codePrimitiveStyles = {
  '.ref-code': {
    ...baseTypography,
    fontFamily: 'mono',
    fontSize: '0.9em',
    backgroundColor: 'gray.100',
    color: 'pink.600',
    paddingInline: '0.4em',
    paddingBlock: '0.15em',
    borderRadius: 'sm',
  },
  '.ref-kbd': {
    ...baseTypography,
    fontFamily: 'mono',
    letterSpacing: '-0.02em',
    fontSize: '0.85em',
    backgroundColor: 'gray.100',
    color: 'gray.800',
    paddingInline: '0.4em',
    paddingBlock: '0.2em',
    borderRadius: 'sm',
    borderWidth: '1px',
    borderBottomWidth: '2px',
    borderStyle: 'solid',
    borderColor: 'gray.300',
    boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
  },
  '.ref-pre': {
    ...baseTypography,
    fontFamily: 'mono',
    letterSpacing: '-0.02em',
    fontSize: 'small',
    lineHeight: '1.6',
    backgroundColor: 'gray.900',
    color: 'gray.100',
    padding: '1em',
    borderRadius: 'md',
    overflowX: 'auto',
    whiteSpace: 'pre',
    marginTop: '0',
    marginBottom: '1em',
  },
  '.ref-samp': {
    ...baseTypography,
    fontFamily: 'mono',
    letterSpacing: '-0.02em',
    fontSize: '0.9em',
    backgroundColor: 'gray.50',
    color: 'gray.700',
    paddingInline: '0.3em',
    paddingBlock: '0.1em',
    borderRadius: 'sm',
  },
} as const

globalCss(codePrimitiveStyles)
