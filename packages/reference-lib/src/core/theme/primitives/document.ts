import { globalCss } from '@reference-ui/system'
import { baseTypography, blockText } from './shared'

export const documentPrimitiveStyles = {
  '.ref-div, .ref-span, .ref-main, .ref-header, .ref-footer, .ref-section, .ref-article, .ref-aside, .ref-nav, .ref-search, .ref-form, .ref-address, .ref-hgroup':
    {
      ...baseTypography,
    },

  '.ref-article, .ref-section, .ref-aside, .ref-header, .ref-footer, .ref-nav, .ref-main':
    {
      display: 'block',
    },

  '.ref-address': {
    fontStyle: 'normal',
    lineHeight: '1.6',
  },

  '.ref-hr': {
    height: '0',
    borderWidth: '0',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: '{colors.ui.hr.border}',
    marginBlock: '6r',
  },

  '.ref-dialog': {
    ...blockText,
    width: 'calc(100% - calc(8 * var(--spacing-r)))',
    maxWidth: '36rem',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '{colors.ui.dialog.border}',
    borderRadius: 'lg',
    backgroundColor: '{colors.ui.dialog.background}',
    color: '{colors.ui.dialog.foreground}',
    padding: '6r',
  },

  '.ref-data, .ref-time': {
    ...baseTypography,
    color: '{colors.ui.meta.foreground}',
  },

  '.ref-ruby': {
    ...baseTypography,
  },

  '.ref-rt, .ref-rp': {
    ...baseTypography,
    color: '{colors.ui.meta.foreground}',
    fontSize: '0.75em',
  },
} as const

globalCss(documentPrimitiveStyles)
