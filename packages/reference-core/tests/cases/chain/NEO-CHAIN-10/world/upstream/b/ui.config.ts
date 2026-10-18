// Config for the NEO-CHAIN-10 branch b. It takes its token source and emits a real published base system
// that overrides the shared base a. The spec rewrites it to extend a, then restores this exact spelling.
// It is committed extends-free so the tree typechecks before any sync.

import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-chain10-b',
  include: ['theme/**/*.{ts,tsx}'],
  extends: [],
})
