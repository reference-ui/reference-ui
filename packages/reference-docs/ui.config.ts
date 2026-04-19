import { defineConfig } from '@reference-ui/core'
import { baseSystem } from '@reference-ui/lib'

export default defineConfig({
  name: 'reference-docs',
  extends: [baseSystem],
  include: ['src/**/*.{ts,tsx,mdx}', '../reference-icons/src/**/*.{ts,tsx}'],
  normalizeCss: true,
  useDesignSystem: true,
  debug: false,
  mcp: {
    include: ['@reference-ui/lib'],
  },
})
