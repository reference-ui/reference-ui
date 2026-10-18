// World config for CORE-WATCH-14: a Core config named for the case, with theme/ as its include. The spec runs the real
// `ref sync --watch` CLI against this world with a loader shim that drops one event batch the way FSEvents does.
// It emits the config that the runner's sync and the spawned watch both load.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-watch-14',
  include: ['theme/**/*.{ts,tsx}'],
})
