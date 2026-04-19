import { globalCss } from '@reference-ui/system'
import { baseTypography } from './baseTypography'

export const inlinePrimitiveStyles = {
  '.ref-abbr': {
    ...baseTypography,
    textDecoration: 'underline dotted',
    textUnderlineOffset: '0.15em',
    cursor: 'help',
  },
  '.ref-b': {
    ...baseTypography,
    fontWeight: 'bold',
  },
  '.ref-em': {
    ...baseTypography,
    fontStyle: 'italic',
  },
  '.ref-i': {
    ...baseTypography,
    fontStyle: 'italic',
  },
  '.ref-mark': {
    ...baseTypography,
    backgroundColor: 'yellow.200',
    color: 'gray.900',
    paddingInline: '0.25em',
    borderRadius: 'sm',
  },
  '.ref-q': {
    ...baseTypography,
    fontStyle: 'italic',
    _before: {
      content: '"\\201C"',
    },
    _after: {
      content: '"\\201D"',
    },
  },
  '.ref-s': {
    ...baseTypography,
    textDecoration: 'line-through',
    opacity: '0.7',
  },
  '.ref-strong': {
    ...baseTypography,
    fontWeight: 'bold',
  },
  '.ref-u': {
    ...baseTypography,
    textDecoration: 'underline',
    textUnderlineOffset: '0.15em',
    textDecorationThickness: '0.08em',
  },
  '.ref-var': {
    ...baseTypography,
    fontFamily: 'serif',
    letterSpacing: 'normal',
    fontStyle: 'italic',
    color: 'blue.600',
  },
} as const

globalCss(inlinePrimitiveStyles)
