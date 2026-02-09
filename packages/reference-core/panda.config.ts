import { defineConfig } from '@pandacss/dev'
import { defaultTheme, defaultStaticCss } from './src/styled/index.js'
import { rhythmUtilities } from './src/styled/rhythm.js'
import { responsivePatterns, responsiveGlobalCss } from './src/styled/responsive.js'

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
 * Elegant Integration Principles:
 * - Core owns Panda compilation
 * - Scans real consumer source (no copying)
 * - TypeScript path resolution aligns Panda + TS
 * - .panda/ is internal IR, not published
 * 
 * Run: panda codegen && panda css
 */
export default defineConfig({
  presets: [],
  jsxFramework: 'react',
  preflight: true,
  
  // Scan core + consumer source directly (no copying)
  include: [
    'src/**/*.{ts,tsx}',
    '../../packages/reference-docs/src/**/*.{ts,tsx}',
    '../../packages/reference-docs/app/**/*.{ts,tsx}',
  ],
  
  exclude: [
    '**/node_modules/**',
    '**/*.test.*',
    '**/*.spec.*',
    'src/system/**',  // Don't watch Panda's own output
  ],
  
  // Output directly to src/system/ (committed, imported by entry)
  outdir: 'src/system',
  outExtension: 'js',
  hash: false,
  
  // Emit static CSS for all common token values to support runtime usage
  staticCss: defaultStaticCss as unknown as Parameters<typeof defineConfig>[0]['staticCss'],
  utilities: {
    extend: rhythmUtilities,
  },
  theme: {
    tokens: defaultTheme.extend.tokens,
  },
  patterns: {
    extend: asExtendablePatterns(responsivePatterns),
  },
  globalCss: responsiveGlobalCss,
  
  // Critical: Use tsconfig to resolve @reference-ui/core imports to source
  tsconfig: './tsconfig.json',
})
