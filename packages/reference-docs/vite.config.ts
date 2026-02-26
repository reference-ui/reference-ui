import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import { resolve } from 'path'

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
  resolve: {
    alias: {
      '@reference-ui/core/styles.css': resolve(__dirname, 'node_modules/@reference-ui/core/src/system/styles.css'),
      '@reference-ui/system/styles.css': resolve(__dirname, 'node_modules/@reference-ui/system/styles.css'),
    },
  },
  server: {
    port: 5174,
  },
})
