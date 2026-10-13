// Config for the NEO-LAYERS-12 world. It takes the sync defaults with no upstreams and emits a
// standalone build, so the generated system entry carries the ReferenceUIConfig the spec typechecks
// a consumer against. The spec never rewrites this file.

import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-layers12',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
})
