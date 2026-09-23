import { defineConfig, type PluginOption } from 'vite'
import contentCollections from '@content-collections/vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'

export default defineConfig(() => {
  const plugins: PluginOption[] = [
    {
      enforce: 'pre' as const,
      ...mdx({
        providerImportSource: '@mdx-js/react',
        remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
      }),
    },
    contentCollections(),
    react({ include: /\.(mdx|js|jsx|ts|tsx)$/ }),
  ]

  return {
    plugins,
    server: {
      port: 5174,
    },
  }
})
