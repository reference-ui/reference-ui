// World config: it names the neo-ref09 system and includes the theme plus the reference fixtures.
// Tasty scans the same include roots on its background pass, so every fixture symbol lands in the manifest.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-ref09',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
})
