// Config for the NEO-LAYERS-14 twin upstream. It takes its token and utility sources and
// emits a real published base system whose name equals the consumer's own name, so the
// self-named legs are backed by genuine sync output. The spec syncs this directory for
// real before the legs run.

import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-layers14',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
})
