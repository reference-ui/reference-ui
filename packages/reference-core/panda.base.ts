import { defineConfig, type Config } from '@pandacss/dev'
import { extendPandaConfig } from '@reference-ui/core/panda-config'

// Side effects: register theme, utilities, globalCss, etc. via styled/api
import './src/styled/index'
import './src/styled/props/index'

/** Structural base config. Theme, utilities, globalCss, etc. are extended via styled/api. */
const baseConfig = {
  presets: [],
  jsxFramework: 'react' as const,
  preflight: true,

  include: [
    'src/**/*.{ts,tsx}',
    'codegen/**/*.{ts,tsx,jsx}',
  ],

  exclude: [
    '**/node_modules/**',
    '**/*.test.*',
    '**/*.spec.*',
    'src/system/**',
    'src/cli/**',
    'src/config/**',
  ],

  dependencies: [],
  outdir: 'src/system',
  outExtension: 'js' as const,
  hash: false,
} satisfies Partial<Config>

extendPandaConfig(baseConfig)

export { baseConfig }
export default defineConfig(baseConfig)
