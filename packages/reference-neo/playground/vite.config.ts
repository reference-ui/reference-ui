import { defineConfig } from 'vite';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Playground server: serves tsx straight from source with classic
// createElement output (no react plugin). The banner owns the factory
// bindings, mirroring the case-world build; app sources stay idiomatic JSX.
// Generated-package ids alias to the synced bundles (vite dev cannot leave
// bare ids for an import map, so the alias is the vite-native equivalent).
const playgroundRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: playgroundRoot,
  server: { port: 5199, strictPort: true },
  resolve: {
    // Post-D4/D5: styled is data-only (styles.css + runtime-data.mjs) and the
    // bound css()/recipe() runtime ships inside the react bundle, so react is
    // the only alias and styled resolves to nothing.
    alias: [{ find: '@reference-ui/react', replacement: `${playgroundRoot}/.reference-ui/react/react.mjs` }],
  },
  esbuild: {
    jsx: 'transform',
    jsxFactory: 'createElement',
    jsxFragment: 'Fragment',
    banner: "import { createElement, Fragment } from '@reference-ui/react';",
  },
});
