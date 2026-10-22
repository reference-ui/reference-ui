// Token fragment for the SYNC-18 world: declares the red color token through tokens(). Takes nothing
// and emits the fragment the sync evaluates, so the want in theme/in.ts resolves to a known token.
import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    red: { value: '#dc2626' },
  },
})
