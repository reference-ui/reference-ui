// Config for the NEO-LAYERS-06 world. It takes the sync defaults and emits a
// standalone build with no upstreams: the spec rewrites this file mid-run to
// layer or extend the upstream by a relative or a bare import, then restores
// this exact spelling in a finally.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-layers6',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
})
