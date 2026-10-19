// Config for the CORE-LAYERS-19 world. It takes the sync defaults with no upstreams: the spec syncs acme mid-run,
// rewrites this file to list acme's base system under extends, then under layers, and restores this exact
// spelling in a finally, so the tree stays canonical whatever the run does.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-layers19',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
  extends: [],
})
