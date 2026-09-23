// Config for the NEO-CHAIN-03 world. It takes the two chain stand-ins plus
// the sync defaults and emits a parallel build: two independent transitive
// paths land at the same boundary, and the app sees tokens from both chain
// endpoints plus both inner bases. The chains share no leaves, so the merge
// is a pure union with nothing to arbitrate.

import { defineConfig } from '@reference-ui/neo'
import { chain1 } from './theme/chain1.ts'
import { chain2 } from './theme/chain2.ts'

export default defineConfig({
  name: 'neo-chain3',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{js,ts,tsx}'],
  extends: [chain1, chain2],
})
