import { globalCss } from '@reference-ui/neo'

globalCss({
  body: {
    color: '#111111',
    backgroundColor: '#ffffff',
  },
  '.ref-button': {
    color: '#ffffff',
    backgroundColor: '#7c3aed',
    padding: '0.5rem',
    borderRadius: '12px',
    '&:hover': { backgroundColor: '#111111' },
    '&:disabled': { backgroundColor: '#999999' },
  },
  '.ref-card': {
    borderRadius: '12px',
    padding: '1rem',
  },
})
