// Config for the CORE-LAYERS-11 branch b. It takes its token and utility sources and emits a real
// published base system. The spec rewrites it to extend the shared base a, then restores this exact
// spelling. It is committed extends-free so the tree typechecks before any sync.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-layers11-b',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
  extends: [],
})
