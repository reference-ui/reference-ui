// Consumer token fragment for the CORE-CHAIN-16 world. It defines the token the package components and the local
// control are styled with, and the one the plain package's glyph is given, so the warnings the sync reports are about
// ownership alone, never an unknown token.

import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    chain16Ink: { value: '#0b6e4f' },
    chain16Glyph: { value: '#a21caf' },
  },
})
