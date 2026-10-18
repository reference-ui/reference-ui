// Config for the NEO-CHAIN-02 world. It takes the two branch stand-ins plus
// the sync defaults and emits a diamond build: both branches publish the same
// inner base as one named node, so the app's fragment list keeps it once (E1,
// E2) and every adoption still resolves.

import { defineConfig } from '@reference-ui/neo'
import { left } from './theme/left.ts'
import { right } from './theme/right.ts'

export default defineConfig({
  name: 'neo-chain2',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{js,ts,tsx}'],
  extends: [left, right],
})
