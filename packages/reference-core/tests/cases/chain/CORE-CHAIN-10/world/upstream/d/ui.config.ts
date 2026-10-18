// Config for the CORE-CHAIN-10 diamond d. It takes its token source and emits a real published base system
// that extends the branches b and c. The spec rewrites it to extend them, then restores this exact spelling.
// It is committed extends-free so the tree typechecks before any sync.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-chain10-d',
  include: ['theme/**/*.{ts,tsx}'],
  extends: [],
})
