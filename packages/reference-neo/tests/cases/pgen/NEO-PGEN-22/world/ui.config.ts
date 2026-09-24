// ui.config.ts — sync configuration for the NEO-PGEN-22 world. It takes the
// world src glob and emits the named system the runner syncs before the spec
// runs. The system name is unique per PGEN type case so synced artifacts and
// data-layer stamps never cross between station cases sharing one token set.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-pgen-22',
  include: ['src/**/*.{js,ts,tsx}'],
})
