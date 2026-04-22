import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'

export default defineConfig(async ({ command }) => {
  const plugins: PluginOption[] = [
    {
      enforce: 'pre' as const,
      ...mdx({
        providerImportSource: '@mdx-js/react',
        remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
      }),
    },
    react({ include: /\.(mdx|js|jsx|ts|tsx)$/ }),
  ]

  if (command === 'serve') {
    const { referenceVite } = await import('@reference-ui/core')
    plugins.splice(1, 0, referenceVite())
  }

  return {
    plugins,
    server: {
      port: 5174,
    },
  }
})
