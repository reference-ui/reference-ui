// Config for the CORE-MDX-01 world. It takes the sync defaults and emits the
// system name plus the fragment include glob that now admits `.mdx` alongside
// the JS sources, so the MDX fragment file is discovered and bundled.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-mdx',
  include: ['theme/**/*.{js,ts,tsx,mdx}'],
})
