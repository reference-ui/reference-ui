import { globalCss } from '@reference-ui/system'
import { baseTypography } from './baseTypography'

export const inlinePrimitiveStyles = {
  '.ref-a': {
    ...baseTypography,
    color: 'text.link',
    textDecoration: 'underline',
    textUnderlineOffset: '0.15em',
    textDecorationThickness: '0.08em',
    _hover: {
      color: 'text.highlight',
    },
  },
  '.ref-abbr': {
    ...baseTypography,
    textDecoration: 'underline dotted',
    textDecorationColor: 'text.secondary',
    textUnderlineOffset: '0.15em',
    cursor: 'help',
  },
  '.ref-b': {
    ...baseTypography,
    fontWeight: 'sans.bold',
  },
  '.ref-del': {
    ...baseTypography,
    color: 'text.secondary',
    textDecoration: 'line-through',
  },
  '.ref-dfn': {
    ...baseTypography,
    color: 'text.secondary',
    fontStyle: 'italic',
  },
  '.ref-em': {
    ...baseTypography,
    fontStyle: 'italic',
  },
  '.ref-i': {
    ...baseTypography,
    fontStyle: 'italic',
  },
  '.ref-ins': {
    ...baseTypography,
    color: 'text.primary',
    textDecoration: 'underline',
    textDecorationColor: 'text.highlight',
    textUnderlineOffset: '0.15em',
  },
  '.ref-mark': {
    ...baseTypography,
    backgroundColor: 'text.highlight',
    color: 'white',
    paddingInline: '0.25em',
    borderRadius: 'sm',
  },
  '.ref-q': {
    ...baseTypography,
    color: 'text.secondary',
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
    color: 'text.secondary',
  },
  '.ref-strong': {
    ...baseTypography,
    fontWeight: 'sans.bold',
  },
  '.ref-u': {
    ...baseTypography,
    textDecoration: 'underline',
    textDecorationColor: 'text.secondary',
    textUnderlineOffset: '0.15em',
    textDecorationThickness: '0.08em',
  },
  '.ref-var': {
    ...baseTypography,
    fontFamily: 'serif',
    letterSpacing: 'normal',
    fontStyle: 'italic',
    color: 'text.highlight',
  },
} as const

globalCss(inlinePrimitiveStyles)
