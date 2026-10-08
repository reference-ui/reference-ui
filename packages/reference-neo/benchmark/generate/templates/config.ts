// Config template for bench repos.
// It takes a load plan and emits the ui.config.ts sync reads.
// The include glob walks src plus theme; dead files ride along as glob ballast.
// MDX riding a plan adds theme/**/*.mdx to the glob; the default plan keeps the
// glob byte-identical so the sealed goldens never churn.

import type { LoadPlan } from '../plans.ts'

function includeLiteral(plan: LoadPlan): string {
  return plan.mdxFiles > 0
    ? "['src/**/*.{ts,tsx}', 'theme/**/*.{ts,mdx}']"
    : "['src/**/*.{ts,tsx}', 'theme/**/*.ts']"
}

export function configFile(plan: LoadPlan): string {
  return [
    "import { defineConfig } from '@reference-ui/neo'",
    '',
    'export default defineConfig({',
    `  name: 'bench-${plan.scale}',`,
    `  include: ${includeLiteral(plan)},`,
    '})',
    '',
  ].join('\n')
}
