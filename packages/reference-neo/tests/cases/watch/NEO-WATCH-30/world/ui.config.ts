// ui.config.ts for NEO-WATCH-30. It takes no input and emits the world's Neo config, whose include mixes the
// unrooted **/*.tsx with ../shared/**, the outside-root path the spec writes beside this world. An edit under that
// outside path must still resync the watch.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-watch-outside-root',
  include: ['**/*.tsx', '../shared/**'],
})
