// World config for CORE-WATCH-31: a Core config whose include lists exact file paths, no glob in either entry.
// It takes nothing and emits the config that the runner's sync hook and the spec's watch both load. The watch must
// subscribe the directory holding those files, never walk into a file as if it were a directory.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-watch-31',
  include: ['theme/base.ts', 'theme/tokens.ts'],
})
