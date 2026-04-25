import { globalCss } from '@reference-ui/system'
import { baseTypography } from './baseTypography'

export const inlinePrimitiveStyles = {
  '.ref-a': {
    ...baseTypography,
    color: '{colors.ui.link}',
    textDecoration: 'underline',
    textUnderlineOffset: '0.15em',
    textDecorationThickness: '0.08em',
    _hover: {
      color: '{colors.ui.linkHover}',
    },
  },
  '.ref-abbr': {
    ...baseTypography,
    textDecoration: 'underline dotted',
    textDecorationColor: '{colors.ui.mutedForeground}',
    textUnderlineOffset: '0.15em',
    cursor: 'help',
  },
  '.ref-b': {
    ...baseTypography,
    fontWeight: 'sans.bold',
  },
  '.ref-del': {
    ...baseTypography,
    color: '{colors.ui.mutedForeground}',
    textDecoration: 'line-through',
  },
  '.ref-dfn': {
    ...baseTypography,
    color: '{colors.ui.mutedForeground}',
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
    color: '{colors.ui.foreground}',
    textDecoration: 'underline',
    textDecorationColor: '{colors.ui.link}',
    textUnderlineOffset: '0.15em',
  },
  '.ref-mark': {
    ...baseTypography,
    backgroundColor: '{colors.ui.mark}',
    color: '{colors.ui.markForeground}',
    paddingInline: '0.25em',
    borderRadius: 'sm',
  },
  '.ref-q': {
    ...baseTypography,
    color: '{colors.ui.mutedForeground}',
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
    color: '{colors.ui.mutedForeground}',
  },
  '.ref-strong': {
    ...baseTypography,
    fontWeight: 'sans.bold',
  },
  '.ref-u': {
    ...baseTypography,
    textDecoration: 'underline',
    textDecorationColor: '{colors.ui.mutedForeground}',
    textUnderlineOffset: '0.15em',
    textDecorationThickness: '0.08em',
  },
  '.ref-var': {
    ...baseTypography,
    fontFamily: 'serif',
    letterSpacing: 'normal',
    fontStyle: 'italic',
    color: '{colors.ui.link}',
  },
} as const

globalCss(inlinePrimitiveStyles)
