import { defineConfig } from '@reference-ui/cli'
import { baseSystem } from '@reference-ui/lib'

export default defineConfig({
  name: 'reference-test',
  include: ['**/*.{ts,tsx}'],
  debug: true,
  skipTypescript: true,
  extends: [baseSystem],
})
