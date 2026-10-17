/**
 * The one development gate for @reference-ui/lib's dev-only diagnostics.
 * isDevelopment() reads the literal `process.env.NODE_ENV`, the expression
 * every consumer bundler (Vite dev and build, webpack, esbuild define, Rollup
 * replace) rewrites statically, so a production bundle sees "production" and
 * goes quiet. An unbundled page (no rewrite, no `process`) counts as
 * development without throwing: every production React bundle must rewrite
 * the expression, since React reads it too. dev.test.ts proves each side
 * through real production and development bundles.
 */

// File-local declaration: the package declares no node types in the narrow
// build program, and the expression must stay spelled exactly this way for
// bundlers to replace it.
declare const process: { env: { NODE_ENV?: string } }

export function isDevelopment(): boolean {
  try {
    return process.env.NODE_ENV !== 'production'
  } catch {
    return true
  }
}
