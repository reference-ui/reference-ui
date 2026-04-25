import { globalCss } from '@reference-ui/system'
import { baseTypography, focusRingStyles } from '../shared'

export const inlinePrimitiveStyles = {
  '.ref-a': {
    ...baseTypography,
    ...focusRingStyles,
    borderRadius: 'sm',
    color: '{colors.ui.link.default}',
    textDecoration: 'underline',
    textUnderlineOffset: '0.15em',
    textDecorationThickness: '0.08em',
    _hover: {
      color: '{colors.ui.link.hover}',
    },
  },
  '.ref-abbr': {
    ...baseTypography,
    textDecoration: 'underline dotted',
    textDecorationColor: '{colors.ui.abbr.textDecoration}',
    textUnderlineOffset: '0.15em',
    cursor: 'help',
  },
  '.ref-b': {
    ...baseTypography,
    fontWeight: 'sans.bold',
  },
  '.ref-del': {
    ...baseTypography,
    color: '{colors.ui.del.foreground}',
    textDecoration: 'line-through',
  },
  '.ref-dfn': {
    ...baseTypography,
    color: '{colors.ui.dfn.foreground}',
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
    color: '{colors.ui.ins.foreground}',
    textDecoration: 'underline',
    textDecorationColor: '{colors.ui.ins.decoration}',
    textUnderlineOffset: '0.15em',
  },
  '.ref-mark': {
    ...baseTypography,
    backgroundColor: '{colors.ui.mark.background}',
    color: '{colors.ui.mark.foreground}',
    paddingInline: '0.25em',
    borderRadius: 'sm',
  },
  '.ref-q': {
    ...baseTypography,
    color: '{colors.ui.q.foreground}',
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
    color: '{colors.ui.s.foreground}',
  },
  '.ref-strong': {
    ...baseTypography,
    fontWeight: 'sans.bold',
  },
  '.ref-u': {
    ...baseTypography,
    textDecoration: 'underline',
    textDecorationColor: '{colors.ui.u.textDecoration}',
    textUnderlineOffset: '0.15em',
    textDecorationThickness: '0.08em',
  },
  '.ref-var': {
    ...baseTypography,
    fontFamily: 'serif',
    letterSpacing: 'normal',
    fontStyle: 'italic',
    color: '{colors.ui.varTag.foreground}',
  },
} as const

globalCss(inlinePrimitiveStyles)
