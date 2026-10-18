// Config for the NEO-LAYERS-11 shared base a. It takes its token and utility sources and emits a
// real published base system. Branches b and c both extend it, so it is the diamond's shared leaf.
// The spec syncs this directory for real, so every entry is genuine sync output on disk.

import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-layers11-a',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
})
