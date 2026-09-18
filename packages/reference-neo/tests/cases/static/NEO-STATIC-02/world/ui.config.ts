// Config for the NEO-STATIC-02 world. It takes no inputs beyond the sync
// defaults and emits the static-02 system name, the src include glob, and
// the wildcard staticCss map under proof, so the engine expands the whole
// color category with no per-value call site.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-static-02',
  include: ['src/**/*.{js,ts,tsx}'],
  staticCss: {
    color: ['*'],
  },
})
