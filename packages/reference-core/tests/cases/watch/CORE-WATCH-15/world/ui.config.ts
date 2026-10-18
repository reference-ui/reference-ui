// World config for CORE-WATCH-15: a Core config named for the case, with theme/ as its include. The spec runs the real
// `ref sync --watch` CLI against this world with a loader shim that holds the watcher's first subscribe, which opens
// a window for a save during the boot. It emits the config that the runner's sync and the spawned watch both load.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-watch-15',
  include: ['theme/**/*.{ts,tsx}'],
})
