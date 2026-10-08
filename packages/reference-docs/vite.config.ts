import { defineConfig, type PluginOption } from 'vite'
import { fileURLToPath } from 'node:url'
import contentCollections from '@content-collections/vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import rehypePrettyCode from 'rehype-pretty-code'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'

export default defineConfig(() => {
  const plugins: PluginOption[] = [
    {
      enforce: 'pre' as const,
      ...mdx({
        providerImportSource: '@mdx-js/react',
        // remark-frontmatter teaches the parser the `---` block so it never
        // leaks into the document. We deliberately stop there: exporting it as
        // `frontmatter` is content-collections' job, and a non-component export
        // makes every MDX module Fast Refresh incompatible.
        remarkPlugins: [remarkGfm, remarkFrontmatter],
        rehypePlugins: [
          [
            rehypePrettyCode,
            {
              theme: { light: 'github-light', dark: 'github-dark' },
              keepBackground: false,
              defaultLang: 'plaintext',
            },
          ],
        ],
      }),
    },
    contentCollections({ configPath: 'src/collections/content-collections.ts' }),
    react({ include: /\.(mdx|js|jsx|ts|tsx)$/ }),
  ]

  return {
    plugins,
    server: {
      port: 5174,
      watch: {
        // `ref sync` rewrites the compiled system on every StyleProp it scans,
        // which otherwise full-reloads the app. The client only ever consumes
        // the collector API from `@reference-ui/system`; the `baseSystem`
        // re-export is compile-time only. Ignoring it lets a stylesheet-only
        // change ride `styles.css` HMR instead. A genuine token change still
        // reloads, because the fragment module that declares it is watched.
        ignored: [
          fileURLToPath(new URL('./.reference-ui/system/baseSystem.mjs', import.meta.url)),
        ],
      },
    },
  }
})
