import { defineConfig } from '@pandacss/dev'
import { defaultTheme, defaultStaticCss } from './src/styled/index.js'
import { rhythmUtilities } from './src/styled/rhythm.js'
import { responsivePatterns, responsiveGlobalCss } from './src/styled/responsive.js'

/**
 * Panda config for reference-core.
 * - codegen: emits src/system/ (css, recipes, tokens, types)
 * - cssgen: emits src/system/styles.css (preflight + tokens + static CSS)
 * Run: panda codegen (or --watch) and panda cssgen (or --watch).
 */
export default defineConfig({
  presets: [],
  jsxFramework: 'react',
  preflight: true,
  include: ['src/**/*.ts', 'src/**/*.tsx'],
  exclude: [],
  outdir: 'src/system',
  outExtension: 'js',
  hash: false,
  staticCss: defaultStaticCss as unknown as Parameters<typeof defineConfig>[0]['staticCss'],
  utilities: {
    extend: rhythmUtilities,
  },
  theme: {
    tokens: defaultTheme.extend.tokens,
  },
  patterns: {
    extend: responsivePatterns,
  },
  globalCss: responsiveGlobalCss,
} as Parameters<typeof defineConfig>[0])
