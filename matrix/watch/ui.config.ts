import { defineConfig } from '@reference-ui/core'
import { watchConfigBaseSystem } from './src/watch-config-base-system.ts'

export default defineConfig({
  name: 'watch',
  include: ['src/**/*.{ts,tsx}'],
  extends: [watchConfigBaseSystem],
  debug: false,
})