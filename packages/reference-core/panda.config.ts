import { defineConfig, type Config } from '@pandacss/dev'
import { defaultTheme, defaultStaticCss, defaultGlobalFontface } from './src/styled/index.js'
import { primitiveCSS } from './src/primitives/recipes.js'
import { rhythmUtilities } from './src/styled/rhythm.js'
import { patterns, patternsGlobalCss } from './src/styled/patterns.js'
import { fontStyle } from './src/styled/font.recipe.js'

/** Extracted type for patterns.extend so we can assert our custom patterns. */
type ExtendablePatterns = Parameters<typeof defineConfig>[0]['patterns'] extends { extend?: infer E } ? E : never

/**
 * Asserts our custom patterns are valid for patterns.extend.
 * Our box pattern uses type: 'object' for the `r` prop (breakpoint map).
 * Panda's TypeScript types only allow string|number|boolean; runtime accepts it.
 */
function asExtendablePatterns<T>(patterns: T): ExtendablePatterns {
  return patterns as ExtendablePatterns
}

/**
 * Panda config for reference-core.
 * 
 * Isolated Panda Integration:
 * - Core owns Panda compilation
 * - Scans core source + codegen folder (user files copied by sync command)
 * - This isolates Panda CSS from user's source
 * - .panda/ is internal IR, not published
 * 
 * Run: panda codegen && panda css
 */
const config: Config = {
  presets: [],
  jsxFramework: 'react',
  preflight: true,
  
  // Scan core source + codegen folder (user files copied there by CLI)
  include: [
    'src/**/*.{ts,tsx}',
    // Consumer files are copied to codegen/ by the sync command
    'codegen/**/*.{ts,tsx}',
  ],
  
  exclude: [
    '**/node_modules/**',
    '**/*.test.*',
    '**/*.spec.*',
    'src/system/**',  // Don't watch Panda's own output
    'src/cli/**',     // Don't watch CLI code
    'src/config/**',  // Don't watch config code
  ],
  
  // No dependencies - we scan codegen folder which is managed by CLI
  dependencies: [],
  
  // Output directly to src/system/ (committed, imported by entry)
  outdir: 'src/system',
  outExtension: 'js',
  hash: false,
  
  // Emit static CSS for all common token values to support runtime usage
  staticCss: defaultStaticCss as unknown as Parameters<typeof defineConfig>[0]['staticCss'],
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
  globalFontface: defaultGlobalFontface as unknown as Parameters<typeof defineConfig>[0]['globalFontface'],
}

export default defineConfig(config)
