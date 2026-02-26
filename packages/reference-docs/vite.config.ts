import type { Plugin } from 'vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'

export default defineConfig({
  plugins: [
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
