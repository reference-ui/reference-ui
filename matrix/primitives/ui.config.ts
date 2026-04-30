import { defineConfig } from '@reference-ui/core'
import { baseSystem } from '@reference-ui/lib'

export default defineConfig({
  name: 'primitives',
  include: ['src/**/*.{ts,tsx}'],
  extends: [baseSystem],
  jsxElements: ['PrimitiveJsxMarker'],
  debug: false,
})