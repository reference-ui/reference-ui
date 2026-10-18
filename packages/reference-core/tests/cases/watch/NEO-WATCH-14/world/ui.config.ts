// World config for NEO-WATCH-14: a Neo config named for the case, with theme/ as its include. The spec runs the real
// `ref sync --watch` CLI against this world with a loader shim that drops one event batch the way FSEvents does.
// It emits the config that the runner's sync and the spawned watch both load.

import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-watch-14',
  include: ['theme/**/*.{ts,tsx}'],
})
