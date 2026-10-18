// Config for the NEO-SITE-02 world. It takes no inputs beyond the sync
// defaults and emits the site-02 system name plus the src include glob,
// so the extractor scans the world and meets the member access.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-site-02',
  include: ['src/**/*.{js,ts,tsx}'],
})
