// Config for the CORE-WATCH-32 big upstream. It takes its generated token fragment and emits a published
// base system large enough that each resync's config module weighs hundreds of KB, the size where a
// per-resync leak shows inside forty resyncs. The spec syncs this directory before the watch starts.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-watch-32-big',
  include: ['theme/**/*.{ts,tsx}'],
})
