// Config for the NEO-CHAIN-04 world. It takes the two direct-upstream
// stand-ins plus the sync defaults and emits a parallel-extends build: both
// upstreams adopt at one boundary with no transitive middle, and the second
// entry wins the one leaf they share. Declared extends order is the only
// arbitration here, so the shared leaf proves it.

import { defineConfig } from '@reference-ui/neo'
import { first } from './theme/first.ts'
import { second } from './theme/second.ts'

export default defineConfig({
  name: 'neo-chain4',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{js,ts,tsx}'],
  extends: [first, second],
})
