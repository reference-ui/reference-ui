// Config for the CORE-LAYERS-17 layered upstream. It takes its own token fragment and utility source, and emits a
// real published base system plus a react entry bound to its own layer. The spec syncs this directory for real, so
// the consumer's branded layer is built from sync output and never from a stand-in.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-layers17-up',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
})
