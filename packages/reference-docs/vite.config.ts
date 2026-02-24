import type { Plugin } from 'vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'

/** Watch node_modules/@reference-ui so HMR triggers when ref sync rebuilds packages */
function watchReferenceUi(): Plugin {
  return {
    name: 'watch-reference-ui',
    configureServer(server) {
      server.watcher.options = {
        ...server.watcher.options,
        ignored: [
          /node_modules\/(?!@reference-ui).*/,
          '**/.git/**',
        ],
      }
    },
  }
}

export default defineConfig({
  plugins: [
    watchReferenceUi(),
    {
      enforce: 'pre',
      ...mdx({
        providerImportSource: '@mdx-js/react',
        remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
      }),
    },
    react({ include: /\.(mdx|js|jsx|ts|tsx)$/ }),
  ],
  optimizeDeps: {
    exclude: ['@reference-ui/react', '@reference-ui/system'],
  },
  server: {
    port: 5174,
  },
})
