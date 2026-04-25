import { globalCss } from '@reference-ui/system'
import { baseTypography } from './baseTypography'

export const codePrimitiveStyles = {
  'code': {
    ...baseTypography,
    fontFamily: 'mono',
    fontSize: '0.9em',
    color: '{colors.ui.codeForeground}',
    backgroundColor: '{colors.ui.codeBackground}',
    paddingInline: '0.4em',
    paddingBlock: '0.15em',
    borderRadius: 'sm',
  },
  '.ref-kbd': {
    ...baseTypography,
    fontFamily: 'mono',
    letterSpacing: '-0.02em',
    fontSize: '0.85em',
    backgroundColor: '{colors.ui.muted}',
    color: '{colors.ui.foreground}',
    paddingInline: '0.4em',
    paddingBlock: '0.2em',
    borderRadius: 'sm',
    borderWidth: '1px',
    borderBottomWidth: '2px',
    borderStyle: 'solid',
    borderColor: '{colors.ui.border}',
    boxShadow:
      '0 1px 1px color-mix(in oklch, {colors.ui.foreground} 10%, transparent)',
  },
  '.ref-pre': {
    ...baseTypography,
    fontFamily: 'mono',
    letterSpacing: '-0.02em',
    fontSize: 'small',
    lineHeight: '1.6',
    backgroundColor: '{colors.ui.codeBackground}',
    color: '{colors.ui.codeForeground}',
    padding: '4r',
    borderRadius: 'md',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '{colors.ui.border}',
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
    backgroundColor: '{colors.ui.muted}',
    color: '{colors.ui.mutedForeground}',
    paddingInline: '0.3em',
    paddingBlock: '0.1em',
    borderRadius: 'sm',
  },
} as const

globalCss(codePrimitiveStyles)
