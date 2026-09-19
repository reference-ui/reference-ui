// Config for the NEO-CSS-14 world. It takes no inputs beyond the sync
// defaults and emits the css-14 system name plus the src include glob,
// so the extractor finds the world's css() calls during every run.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-css14',
  include: ['src/**/*.{js,ts,tsx}'],
})
