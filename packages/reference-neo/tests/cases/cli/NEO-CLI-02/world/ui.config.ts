// ui.config.ts — the NEO-CLI-02 world config. It takes no inputs beyond the
// file itself and emits the system the watch-flag legs sync against: name
// neo-cli-watch over the theme sources. The name doubles as the identity
// pin the boot leg asserts in the child's watching line via the world dir.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-cli-watch',
  include: ['theme/**/*.{ts,tsx}'],
})
