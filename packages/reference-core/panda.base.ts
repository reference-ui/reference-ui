import { defineConfig, type Config } from '@pandacss/dev'
import { extendPandaConfig } from '@reference-ui/core/panda-config'
import { defaultTheme, defaultStaticCss, defaultGlobalFontface } from './src/styled/index'
import { primitiveCSS } from './src/primitives/recipes'
import { rhythmUtilities } from './src/styled/rhythm'
import { patternsGlobalCss } from './src/styled/patterns'

// Import patterns and props modules for side effects (pattern/recipe registration)
import './src/styled/patterns'
import './src/styled/props/index'

/** Base config - used by both extendPandaConfig (eval) and generated panda.config (import) */
const baseConfig = {
  presets: [],
  jsxFramework: 'react',
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
  outExtension: 'js',
  hash: false,

  staticCss: defaultStaticCss as unknown as Config['staticCss'],
  utilities: {
    extend: {
      ...rhythmUtilities,
    },
  },
  theme: {
    tokens: defaultTheme.extend.tokens,
    extend: {
      recipes: {
        ...primitiveCSS,
      },
    },
  },
  globalCss: patternsGlobalCss,
  globalFontface: defaultGlobalFontface as unknown as Config['globalFontface'],
} satisfies Partial<Config>

extendPandaConfig(baseConfig)

export { baseConfig }
export default defineConfig(baseConfig)
