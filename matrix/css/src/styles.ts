import { css } from '@reference-ui/react'
import { cssMatrixConstants } from './constants'

export const cssMatrixClasses = {
  card: css({
    padding: '1rem',
    borderRadius: '12px',
    borderWidth: '2px',
    borderStyle: 'solid',
  }),
  hoverable: css({
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  }),
  nestedParent: css({
    '& [data-slot=inner]': {
      marginTop: '12px',
    },
  }),
  positioned: css({
    position: 'relative',
    top: '4px',
    left: '8px',
    padding: '0.5rem',
  }),
  stateful: css({
    borderWidth: '1px',
    borderStyle: 'solid',
  }),
  containerProbe: css({
    padding: '0.25rem',
    fontSize: '1rem',
    r: {
      400: {
        padding: '1rem',
        fontSize: '1.125rem',
      },
    },
  }),
} as const