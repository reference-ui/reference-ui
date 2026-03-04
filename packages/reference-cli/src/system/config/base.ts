import type { Config } from '@pandacss/dev'

/**
 * Pure structural Panda config. No side-effect imports, no dependency on
 * generated code. Used as the base merged with fragment contributions when
 * generating panda.config. Breaks the chicken-and-egg: CLI can run ref sync
 * on itself because this file does not import from system/styled.
 */
export const baseConfig = {
  presets: [],
  jsxFramework: 'react' as const,
  preflight: true,

  include: ['.virtual/**/*.{ts,tsx,js,jsx}', 'src/**/*.{ts,tsx,js,jsx}'],

  exclude: [
    '**/node_modules/**',
    '**/*.test.*',
    '**/*.spec.*',
  ],

  outdir: 'system/styled',
  outExtension: 'js' as const,
  hash: false,
} satisfies Partial<Config>
