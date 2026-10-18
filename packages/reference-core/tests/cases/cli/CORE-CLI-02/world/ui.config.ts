// ui.config.ts — the CORE-CLI-02 world config. It takes no inputs beyond the
// file itself and emits the system the watch-flag legs sync against: name
// core-cli-watch over the theme sources. The boot leg proves routing via
// the child's boot block; the name stays the world's plain identity.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-cli-watch',
  include: ['theme/**/*.{ts,tsx}'],
})
