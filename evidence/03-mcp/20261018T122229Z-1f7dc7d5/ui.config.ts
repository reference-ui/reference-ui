import { defineConfig } from '@reference-ui/core'
import { baseSystem } from '@reference-ui/lib/baseSystem'

export default defineConfig({
  name: '03-mcp',
  include: ['src/**/*.{ts,tsx}'],
  extends: [baseSystem],
})
