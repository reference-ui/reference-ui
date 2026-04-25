import { globalCss } from '@reference-ui/system'
import { baseTypography } from '../shared'

export const codePrimitiveStyles = {
  'code': {
    ...baseTypography,
    fontFamily: 'mono',
    fontSize: '0.9em',
    color: '{colors.ui.code.inline.foreground}',
    backgroundColor: '{colors.ui.code.inline.background}',
    paddingInline: '0.4em',
    paddingBlock: '0.15em',
    borderRadius: 'sm',
  },
  '.ref-kbd': {
    ...baseTypography,
    fontFamily: 'mono',
    letterSpacing: '-0.02em',
    fontSize: '0.85em',
    backgroundColor: '{colors.ui.kbd.background}',
    color: '{colors.ui.kbd.foreground}',
    paddingInline: '0.4em',
    paddingBlock: '0.2em',
    borderRadius: 'sm',
    borderWidth: '1px',
    borderBottomWidth: '2px',
    borderStyle: 'solid',
    borderColor: '{colors.ui.kbd.border}',
    boxShadow:
      '0 1px 1px color-mix(in oklch, {colors.ui.kbd.shadowMix} 10%, transparent)',
  },
  '.ref-pre': {
    ...baseTypography,
    fontFamily: 'mono',
    letterSpacing: '-0.02em',
    fontSize: 'small',
    lineHeight: '1.6',
    backgroundColor: '{colors.ui.pre.background}',
    color: '{colors.ui.pre.foreground}',
    padding: '4r',
    borderRadius: 'md',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '{colors.ui.pre.border}',
    overflowX: 'auto',
    whiteSpace: 'pre',
    marginTop: '0',
    marginBottom: '4r',
  },
  '.ref-samp': {
    ...baseTypography,
    fontFamily: 'mono',
    letterSpacing: '-0.02em',
    fontSize: '0.9em',
    backgroundColor: '{colors.ui.samp.background}',
    color: '{colors.ui.samp.foreground}',
    paddingInline: '0.3em',
    paddingBlock: '0.1em',
    borderRadius: 'sm',
  },
} as const

globalCss(codePrimitiveStyles)
