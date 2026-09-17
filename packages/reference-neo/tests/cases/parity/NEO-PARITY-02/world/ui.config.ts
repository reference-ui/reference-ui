// Config for the NEO-PARITY-01 mini-lib world. It takes the sync defaults
// and emits the parity system name, the src include glob, and a small
// staticCss map (a list, a '*' expansion, and a hover condition), so the
// engine mints colour atoms nobody authored and PARITY-02 can census F29.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-parity',
  include: ['src/**/*.{js,ts,tsx}'],
  staticCss: {
    color: ['brand', 'paper'],
    backgroundColor: ['*'],
    '_hover:color': ['ink'],
  },
})
