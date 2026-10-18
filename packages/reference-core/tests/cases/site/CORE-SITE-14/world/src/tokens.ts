// tokens.ts — token fragment for the CORE-SITE-14 world. It takes the core
// fragment collector and emits one leaf, proving tokens alone resolve no
// hosts. Only a host import could quiet the engine's closed failure here.
import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    ink: { value: '#111111' },
  },
})
