// The one production gate for the Core runtime's dev-only diagnostics.
// isProductionBuild() reads the literal `process.env.NODE_ENV`, the expression
// consumer bundlers (Vite dev and build, webpack, esbuild define) rewrite
// statically, so the css() miss and recipe missing-table warnings go quiet in a
// real production bundle and speak in dev. The packager keeps the expression
// unbaked. An unbundled page (no rewrite, no `process`) counts as development:
// every production React bundle must rewrite it, since React reads it too.

declare const process: { env: { NODE_ENV?: string } }

export function isProductionBuild(): boolean {
  try {
    return process.env.NODE_ENV === 'production'
  } catch {
    return false
  }
}
