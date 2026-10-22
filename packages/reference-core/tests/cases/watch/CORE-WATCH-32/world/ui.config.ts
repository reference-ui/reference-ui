// Config for the CORE-WATCH-32 world. It takes the sync defaults and emits a standalone build with no
// upstreams: the spec rewrites this file mid-run to extend the big upstream, then restores this exact
// spelling in a finally, so the tree is canonical whatever the run does.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-watch-32',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
})
