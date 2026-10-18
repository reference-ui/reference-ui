// World config: it names the core-ref05 system and includes the theme plus the reference fixtures.
// Tasty scans the same include roots on its background pass, so every fixture symbol lands in the manifest.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-ref05',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
})
