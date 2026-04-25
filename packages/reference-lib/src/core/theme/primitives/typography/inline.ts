import { globalCss } from '@reference-ui/system'
import { baseTypography } from './baseTypography'

export const inlinePrimitiveStyles = {
  '.ref-a': {
    ...baseTypography,
    color: 'var(--ui-link)',
    textDecoration: 'underline',
    textUnderlineOffset: '0.15em',
    textDecorationThickness: '0.08em',
    _hover: {
      color: 'var(--ui-link-hover)',
    },
  },
  '.ref-abbr': {
    ...baseTypography,
    textDecoration: 'underline dotted',
    textDecorationColor: 'var(--ui-muted-foreground)',
    textUnderlineOffset: '0.15em',
    cursor: 'help',
  },
  '.ref-b': {
    ...baseTypography,
    fontWeight: 'sans.bold',
  },
  '.ref-del': {
    ...baseTypography,
    color: 'var(--ui-muted-foreground)',
    textDecoration: 'line-through',
  },
  '.ref-dfn': {
    ...baseTypography,
    color: 'var(--ui-muted-foreground)',
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
    color: 'var(--ui-foreground)',
    textDecoration: 'underline',
    textDecorationColor: 'var(--ui-link)',
    textUnderlineOffset: '0.15em',
  },
  '.ref-mark': {
    ...baseTypography,
    backgroundColor: 'var(--ui-mark)',
    color: 'var(--ui-mark-foreground)',
    paddingInline: '0.25em',
    borderRadius: 'sm',
  },
  '.ref-q': {
    ...baseTypography,
    color: 'var(--ui-muted-foreground)',
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
    color: 'var(--ui-muted-foreground)',
  },
  '.ref-strong': {
    ...baseTypography,
    fontWeight: 'sans.bold',
  },
  '.ref-u': {
    ...baseTypography,
    textDecoration: 'underline',
    textDecorationColor: 'var(--ui-muted-foreground)',
    textUnderlineOffset: '0.15em',
    textDecorationThickness: '0.08em',
  },
  '.ref-var': {
    ...baseTypography,
    fontFamily: 'serif',
    letterSpacing: 'normal',
    fontStyle: 'italic',
    color: 'var(--ui-link)',
  },
} as const

globalCss(inlinePrimitiveStyles)
