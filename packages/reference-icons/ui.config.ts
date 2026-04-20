import { defineConfig } from '@reference-ui/core'
import { ICON_JSX_NAMES } from './src/jsx-names'

export default defineConfig({
  name: 'reference-icons',
  include: ['src/**/*.{ts,tsx}'],
  jsxElements: [...ICON_JSX_NAMES],
  extends: [],
  debug: false,
})
