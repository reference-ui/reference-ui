// Vite app config for the reference-docs site.
// It wires MDX (GFM + frontmatter + section ids + build-time Shiki highlighting),
// content-collections metadata, and React Fast Refresh, pre-bundles the linked lib
// barrel, and serves on 5174 with a polling watcher that skips sync's scratch output.
import { defineConfig, type PluginOption } from 'vite'
import { fileURLToPath } from 'node:url'
import contentCollections from '@content-collections/vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
// The MDX plugin list lives in src/mdx/pipeline.ts, where the docs quality gate reads it too.
import { mdxOptions } from './src/mdx/pipeline'

const generatedDir = fileURLToPath(new URL('./.reference-ui/', import.meta.url))

export default defineConfig(() => {
  const plugins: PluginOption[] = [
    {
      enforce: 'pre' as const,
      ...mdx(mdxOptions),
    },
    contentCollections({ configPath: 'src/collections/content-collections.ts' }),
    react({ include: /\.(mdx|js|jsx|ts|tsx)$/ }),
  ]

  return {
    plugins,
    optimizeDeps: {
      // Linked workspace packages are served unbundled in dev. The lib barrel
      // imports every icon, so that was ~7,900 module requests per page load.
      // Pre-bundling collapses them to a few chunks. A rebuilt lib dist needs
      // a dev-server restart (or `--force`) to show up here.
      include: ['@reference-ui/lib'],
    },
    server: {
      port: Number(process.env.PORT) || 5174,
      watch: {
        // macOS FSEvents lags or drops events outright when fseventsd is
        // saturated, and the watcher then never hears about a saved page or a
        // rewritten stylesheet. Polling a few hundred files stays cheap and
        // cannot miss a change.
        usePolling: true,
        interval: 250,
        ignored: [
          // Sync's scratch output: every sync rewrites hundreds of type files
          // and stages the next folder beside the live one.
          `${generatedDir}types/**`,
          `${generatedDir}tmp/**`,
          `${generatedDir}sync.*/**`,
          `${generatedDir}**/*.tmp-*/**`,
          // `ref sync` rewrites the compiled system on every StyleProp it scans.
          // The client only consumes the collector API from `@reference-ui/system`;
          // the `baseSystem` re-export is compile-time only, so a rewrite there
          // must not full-reload the app. A genuine token change still reloads,
          // because the fragment module that declares it is watched.
          `${generatedDir}system/baseSystem.mjs`,
        ],
      },
    },
  }
})
