# Vite & Webpack tightening

`referenceVite()` and `referenceWebpack()` are first-class Reference UI support — they are how `ref sync --watch` feels native in a real bundler. They should not be a side quest that only typechecks against the Vite copy sitting in this workspace.

## Current state

Vite’s `Plugin` type is copy-identity-sensitive under pnpm. Core’s peer is `vite@^5 || ^6 || ^7`, so the public return type is structural (`ReferenceVitePlugin`) rather than `import('vite').Plugin` from core’s own Vite. That keeps consumer `vite.config.ts` files compiling. It also means TypeScript will not catch Vite API drift for us.

Runtime shape checks and try/catch in `referenceVite()` are the current detector: fail open, warn once, never take down the user’s dev server. That is defensive, not coverage.

Webpack is in the same boat. Its compiler surface is already a local structural type, but we do not yet prove it against the Webpack versions we claim to support.

## Tighten next

- Matrix (or dedicated) tests against **Vite 5, 6, 7, and latest**.
- Same for Webpack: declare the versions we actually support and test them.
- Treat bundler plugins as a first-class Reference concept, even if they later move out of `reference-core`.
- Until that matrix exists, drift shows up as a branded `[vite]` / `[webpack]` warning, not a red type in the user’s config.

See `packages/reference-core/src/vite/` and `packages/reference-core/src/webpack/`.
