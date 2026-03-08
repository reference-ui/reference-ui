import { defineConfig } from '@reference-ui/cli'
import { baseSystem } from '@reference-ui/lib'

export default defineConfig({
  name: 'reference-docs',
  extends: [baseSystem],
  include: ['src/**/*.{ts,tsx,mdx}'],
  normalizeCss: true,
  useDesignSystem: true,
  debug: true,
})
