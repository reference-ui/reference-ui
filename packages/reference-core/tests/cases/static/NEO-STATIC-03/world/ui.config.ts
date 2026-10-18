// Config for the NEO-STATIC-03 world. It takes no inputs beyond the sync
// defaults and emits the static-03 system name, the src include glob, and
// a staticCss map covering ember alone, so gold stays a real token with no
// atom and the miss leg has something to fail against.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-static-03',
  include: ['src/**/*.{js,ts,tsx}'],
  staticCss: {
    color: ['ember'],
  },
})
