// Config for the NEO-STATIC-01 world. It takes no inputs beyond the sync
// defaults and emits the static-01 system name, the src include glob, and
// the staticCss map under proof, so the engine mints atoms nobody authored.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-static-01',
  include: ['src/**/*.{js,ts,tsx}'],
  staticCss: {
    color: ['ember', 'gold'],
    '_hover:color': ['gold'],
  },
})
