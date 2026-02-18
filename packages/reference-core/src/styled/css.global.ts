import { extendGlobalCss } from './api'

// Global CSS: rhythm tokens and body defaults
extendGlobalCss({
  ':root': {
    '--r-base': '16px',
    '--r-density': '1',
    '--spacing-r': 'calc(var(--r-base) * var(--r-density))',
  },
  body: {
    fontFamily: 'sans',
    letterSpacing: '-0.01em',
    fontSize: 'body',
    containerType: 'inline-size',
  },
})
