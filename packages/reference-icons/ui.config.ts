// Sync config for @reference-ui/icons.
// It scans the icon sources with no base system of its own; the compiled output becomes
// the packaged base system downstream projects extend or layer.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'reference-icons',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
})
