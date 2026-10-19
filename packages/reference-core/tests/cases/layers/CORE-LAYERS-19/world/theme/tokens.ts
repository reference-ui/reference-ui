// Token fragment for the CORE-LAYERS-19 app. It takes the core token collector and emits one colour, `brand`,
// with a dark leaf. acme defines `brand` too, with other values, so the spec can tell whose value paints inside
// acme's components: the app's under extends, acme's under layers.

import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    brand: { value: '#15803d', dark: '#86efac' },
  },
})
