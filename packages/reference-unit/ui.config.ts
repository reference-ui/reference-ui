import { defineConfig } from '@reference-ui/core'
import { baseSystem } from '@fixtures/extend-library'
import { baseSystem as layerLibSystem } from '@fixtures/layer-library'

export default defineConfig({
  name: 'reference-unit',
  extends: [baseSystem],
  layers: [layerLibSystem],
  include: ['src/**/*.{ts,tsx,mdx}', 'tests/**/*.{ts,tsx,mdx}'],
  debug: true,
})
