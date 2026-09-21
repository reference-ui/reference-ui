// Config template for bench repos.
// It takes a load plan and emits the ui.config.ts sync reads.
// The include glob walks src plus theme; dead files ride along as glob ballast.

import type { LoadPlan } from '../plans.ts'

export function configFile(plan: LoadPlan): string {
  return [
    "import { defineConfig } from '@reference-ui/neo'",
    '',
    'export default defineConfig({',
    `  name: 'bench-${plan.scale}',`,
    "  include: ['src/**/*.{ts,tsx}', 'theme/**/*.ts'],",
    '})',
    '',
  ].join('\n')
}
