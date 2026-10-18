// Config for the CORE-LAYERS-04 world. It takes the sync defaults plus a local
// global block, so the container-root check has global CSS to inspect. It emits
// a standalone build: the spec rewrites this file mid-run to layer or extend the
// container-root upstream, then restores this exact spelling in a finally.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-layers4',
  include: ['src/**/*.{ts,tsx}', 'theme/**/*.{ts,tsx}'],
  extends: [],
})
