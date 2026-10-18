// Config for the CORE-PARITY-01 mini-lib world. It takes the sync defaults
// and emits the parity system name, the src include glob, and a small
// staticCss map (a list, a '*' expansion, and a hover condition), so the
// engine mints colour atoms nobody authored and PARITY-02 can census F29.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-parity',
  include: ['src/**/*.{js,ts,tsx}'],
  staticCss: {
    color: ['brand', 'paper'],
    backgroundColor: ['*'],
    '_hover:color': ['ink'],
  },
})
