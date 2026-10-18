// Config for the NEO-CHAIN-09 shared base a. It takes its token source and emits a real published base
// system that branches b and c extend. It is committed extends-free so the tree typechecks before any sync.

import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-chain9-a',
  include: ['theme/**/*.{ts,tsx}'],
  extends: [],
})
