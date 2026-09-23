// Config for the NEO-CHAIN-02 world. It takes the two branch stand-ins plus
// the sync defaults and emits a diamond build: both branches republish the
// same inner base, so the shared leaves land at the app boundary twice and
// every adoption still resolves. No deduplication is promised — only that
// the composed app boots and all tokens paint.

import { defineConfig } from '@reference-ui/neo'
import { left } from './theme/left.ts'
import { right } from './theme/right.ts'

export default defineConfig({
  name: 'neo-chain2',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{js,ts,tsx}'],
  extends: [left, right],
})
