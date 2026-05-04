import { globalCss } from '@reference-ui/system'
import { baseTypography } from '../shared'

export const formBasePrimitiveStyles = {
  '.ref-fieldset': {
    ...baseTypography,
    display: 'grid',
    gap: '3r',
    minWidth: '0',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '{colors.ui.fieldset.border}',
    borderRadius: 'md',
    padding: '4r',
    margin: '0',
  },

  '.ref-legend': {
    ...baseTypography,
    paddingInline: '1r',
    fontSize: '3.5r',
    fontWeight: '500',
  },

  '.ref-label': {
    ...baseTypography,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2r',
    fontSize: '3.5r',
    fontWeight: '500',
    lineHeight: '5r',
  },

  '.ref-label .ref-input': {
    flexShrink: 0,
    width: '4r',
    height: '4r',
    padding: '0',
    borderRadius: 'sm',
    accentColor: '{colors.ui.label.controlAccent}',
  },
} as const

globalCss(formBasePrimitiveStyles)
