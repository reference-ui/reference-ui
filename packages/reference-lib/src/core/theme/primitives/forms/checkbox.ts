import { globalCss } from '@reference-ui/system'
import { focusRing } from '../shared'

export const checkboxPrimitiveStyles = {
  '.ref-input[type="checkbox"]': {
    appearance: 'none',
    display: 'inline-grid',
    placeContent: 'center',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'color-mix(in oklch, var(--ui-foreground) 28%, transparent)',
    borderRadius: 'sm',
    backgroundColor: 'transparent',
    transitionProperty: 'background-color, border-color, box-shadow',
    transitionDuration: '150ms',
    transitionTimingFunction: 'ease',
    _checked: {
      backgroundColor: 'var(--ui-foreground)',
      borderColor: 'var(--ui-foreground)',
      _before: {
        opacity: 1,
      },
    },
    _before: {
      content: '""',
      width: '2r',
      height: '1r',
      borderLeftWidth: '2px',
      borderBottomWidth: '2px',
      borderLeftStyle: 'solid',
      borderBottomStyle: 'solid',
      borderColor: 'var(--ui-background)',
      opacity: 0,
      transform: 'translateY(-1px) rotate(-45deg)',
    },
    _focusVisible: focusRing,
  },
} as const

globalCss(checkboxPrimitiveStyles)
