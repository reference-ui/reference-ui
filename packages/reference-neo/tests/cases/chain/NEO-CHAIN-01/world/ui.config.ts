// Config for the NEO-CHAIN-01 world. It takes the outer stand-in plus the
// sync defaults and emits a transitive build: the app extends only the
// outer system, whose fragment already republishes the inner base, so the
// merged spec carries both depths without the app naming the inner base.

import { defineConfig } from '@reference-ui/neo'
import { outer } from './theme/outer.ts'

export default defineConfig({
  name: 'neo-chain1',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{js,ts,tsx}'],
  extends: [outer],
})
