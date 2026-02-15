import { defineConfig, type Config } from '@pandacss/dev'
import { extendPandaConfig } from '@reference-ui/core/panda-config'
import { defaultTheme, defaultStaticCss, defaultGlobalFontface } from './src/styled/index.js'
import { primitiveCSS } from './src/primitives/recipes.js'
import { rhythmUtilities } from './src/styled/rhythm.js'
import { patterns, patternsGlobalCss } from './src/styled/patterns.js'
import { fontStyle } from './src/styled/font.recipe.js'

/** Extracted type for patterns.extend so we can assert our custom patterns. */
type ExtendablePatterns = Parameters<typeof defineConfig>[0]['patterns'] extends { extend?: infer E }
  ? E
  : never

function asExtendablePatterns<T>(p: T): ExtendablePatterns {
  return p as ExtendablePatterns
}

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
        fontStyle,
      },
    },
  },
  patterns: {
    extend: asExtendablePatterns(patterns),
  },
  globalCss: patternsGlobalCss,
  globalFontface: defaultGlobalFontface as unknown as Config['globalFontface'],
} satisfies Partial<Config>

extendPandaConfig(baseConfig)

export { baseConfig }
export default defineConfig(baseConfig)
