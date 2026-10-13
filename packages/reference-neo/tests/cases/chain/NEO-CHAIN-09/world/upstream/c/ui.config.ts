// Config for the NEO-CHAIN-09 branch c. It takes its token source and emits a real published base system
// that extends the shared base a and leaves x alone. The spec rewrites it to extend a, then restores this
// exact spelling. It is committed extends-free so the tree typechecks before any sync.

import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-chain9-c',
  include: ['theme/**/*.{ts,tsx}'],
  extends: [],
})
