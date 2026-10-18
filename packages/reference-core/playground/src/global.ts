// Global CSS for the playground: the raw tag and class rules every page can
// rely on. It takes nothing and hands globalCss() literal declarations — a
// body reset plus the .ref-button and .ref-card rules pages reference by
// class name. Colours are hardcoded hex on purpose: this sheet is the
// playground's floor and stays independent of the token set in src/tokens.ts.
// The engine prints these as plain global selectors, state variants included.
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
