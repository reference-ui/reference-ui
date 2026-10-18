// ui.config.ts — the NEO-CLI-02 world config. It takes no inputs beyond the
// file itself and emits the system the watch-flag legs sync against: name
// neo-cli-watch over the theme sources. The boot leg proves routing via
// the child's boot block; the name stays the world's plain identity.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-cli-watch',
  include: ['theme/**/*.{ts,tsx}'],
})
