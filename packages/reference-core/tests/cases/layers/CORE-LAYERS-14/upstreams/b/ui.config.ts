// Config for the CORE-LAYERS-14 plain upstream B. It takes its token and utility sources
// and emits a real published base system with its own name only. The spec syncs this
// directory for real before the legs run, and the repeat legs list it twice.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-layers14-b',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
})
