# Vite & Webpack

`referenceVite()` and `referenceWebpack()` are how `ref sync --watch` feels native in a real bundler. They are first-class Reference UI support, even if they later move out of `reference-core`.

## What shipped

Core’s Vite peer is `^5 || ^6 || ^7`. Vite’s `Plugin` type is copy-identity-sensitive under pnpm, so `referenceVite()` returns a structural `ReferenceVitePlugin` instead of `import('vite').Plugin` from core’s own Vite. Consumer `vite.config.ts` files compile. TypeScript will not catch Vite API drift.

`referenceVite()` therefore fails open:

- Runtime-checks `moduleGraph` and `ws.send` before attaching.
- try/catch around configure, HMR, flush, and watchers.
- Warns once per failure class (`ref → vite`).
- Never takes down the user’s dev server.

Webpack already uses a local structural compiler type. It does not yet fail open or warn the same way.

## Still owed

- Matrix tests against **Vite 5, 6, 7, and latest**.
- The same for Webpack: declare the versions we actually support and test them.
- Webpack warnings and fail-open, matching Vite.

Until that matrix exists, drift shows up as a branded warning, not a red type in the user’s config.

Code: `packages/reference-core/src/vite/`, `packages/reference-core/src/webpack/`.
