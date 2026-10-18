// Config for the CORE-CHAIN-05 world. It takes the apex stand-in plus the
// sync defaults and emits a depth-three build: the app extends only the apex
// system, whose fragment flattens two republished depths beneath its own
// local leaf. Fragment flattening must hold past depth two, so all three
// depths paint from the single extends entry.

import { defineConfig } from '@reference-ui/core'
import { apex } from './theme/apex.ts'

export default defineConfig({
  name: 'core-chain5',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{js,ts,tsx}'],
  extends: [apex],
})
