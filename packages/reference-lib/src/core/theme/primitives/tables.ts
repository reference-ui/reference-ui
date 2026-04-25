import { globalCss } from '@reference-ui/system'
import { baseTypography } from './typography/baseTypography'

export const tablePrimitiveStyles = {
  '.ref-table': {
    ...baseTypography,
    width: '100%',
    captionSide: 'bottom',
    borderCollapse: 'collapse',
    fontSize: '3.5r',
    lineHeight: '5r',
  },

  '.ref-tfoot': {
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: 'var(--ui-border)',
    backgroundColor: 'color-mix(in oklch, var(--ui-muted) 50%, transparent)',
    fontWeight: '500',
  },

  '.ref-thead .ref-tr': {
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'var(--ui-border)',
  },

  '.ref-tbody .ref-tr:last-child': {
    borderBottomWidth: '0',
  },

  '.ref-tr': {
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'var(--ui-border)',
    transitionProperty: 'background-color',
    transitionDuration: '150ms',
    transitionTimingFunction: 'ease',
    _hover: {
      backgroundColor: 'color-mix(in oklch, var(--ui-muted) 50%, transparent)',
    },
  },

  '.ref-th': {
    ...baseTypography,
    height: '10r',
    paddingInline: '2r',
    textAlign: 'left',
    verticalAlign: 'middle',
    color: 'var(--ui-foreground)',
    fontSize: '3.5r',
    fontWeight: '500',
    lineHeight: '5r',
    whiteSpace: 'nowrap',
  },

  '.ref-td': {
    ...baseTypography,
    padding: '2r',
    verticalAlign: 'middle',
    color: 'var(--ui-foreground)',
    fontSize: '3.5r',
    lineHeight: '5r',
    whiteSpace: 'nowrap',
  },

  '.ref-caption': {
    ...baseTypography,
    marginTop: '4r',
    color: 'var(--ui-muted-foreground)',
    fontSize: '3.5r',
    lineHeight: '5r',
  },
} as const

globalCss(tablePrimitiveStyles)
