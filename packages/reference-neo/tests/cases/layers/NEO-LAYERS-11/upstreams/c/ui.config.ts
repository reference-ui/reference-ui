// Config for the NEO-LAYERS-11 branch c. It takes its token and utility sources and emits a real
// published base system. The spec rewrites it to extend the shared base a, then restores this exact
// spelling. It is committed extends-free so the tree typechecks before any sync.

import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-layers11-c',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
  extends: [],
})
