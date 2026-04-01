import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'atlas-project',
  include: ['src/**/*.{ts,tsx}'],
  mcp: {
    include: ['src/pages/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}'],
    exclude: ['src/pages/ProfilePage.tsx', 'src/components/UserBadge.tsx'],
  },
})
