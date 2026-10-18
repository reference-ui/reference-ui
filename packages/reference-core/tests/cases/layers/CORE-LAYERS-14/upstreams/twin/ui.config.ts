// Config for the CORE-LAYERS-14 twin upstream. It takes its token and utility sources and
// emits a real published base system whose name equals the consumer's own name, so the
// self-named legs are backed by genuine sync output. The spec syncs this directory for
// real before the legs run.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-layers14',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
})
