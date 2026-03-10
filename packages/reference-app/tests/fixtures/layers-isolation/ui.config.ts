import { defineConfig } from '@reference-ui/core'
import { baseSystem as referenceAppBaseSystem } from '../../../.reference-ui/system/baseSystem.mjs'

export default defineConfig({
  name: 'layers-isolation',
  include: ['src/**/*.{ts,tsx}'],
  layers: [referenceAppBaseSystem],
  debug: true,
  skipTypescript: true,
})
