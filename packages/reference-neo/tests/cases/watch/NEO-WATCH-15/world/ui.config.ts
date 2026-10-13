// World config for NEO-WATCH-15: a Neo config named for the case, with theme/ as its include. The spec runs the real
// `ref sync --watch` CLI against this world with a loader shim that holds the watcher's first subscribe, which opens
// a window for a save during the boot. It emits the config that the runner's sync and the spawned watch both load.

import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-watch-15',
  include: ['theme/**/*.{ts,tsx}'],
})
