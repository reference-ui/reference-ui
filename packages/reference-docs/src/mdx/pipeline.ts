// MDX compile options shared by the Vite config and the docs quality gate.
// It takes nothing and emits the options the @mdx-js/rollup plugin compiles every page with,
// so the gate's compile check runs the app's own remark and rehype list, not a copy of it.
import type { Options as MdxOptions } from '@mdx-js/rollup'
import rehypePrettyCode from 'rehype-pretty-code'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import { rehypeSectionIds } from './rehypeSectionIds.ts'

export const mdxOptions: MdxOptions = {
  providerImportSource: '@mdx-js/react',
  // Pages are `.mdx` only. Plain `.md` stays text, so the repo-root
  // INSTALL.md can be imported with `?raw` at build time for the install prompt.
  mdExtensions: [],
  // remark-frontmatter teaches the parser the `---` block so it never
  // leaks into the document. We deliberately stop there: exporting it as
  // `frontmatter` is content-collections' job, and a non-component export
  // makes every MDX module Fast Refresh incompatible.
  remarkPlugins: [remarkGfm, remarkFrontmatter],
  rehypePlugins: [
    rehypeSectionIds,
    [
      rehypePrettyCode,
      {
        theme: { light: 'github-light', dark: 'github-dark' },
        keepBackground: false,
        defaultLang: 'plaintext',
        // Inline code stays unhighlighted. Shiki would otherwise wrap every inline code
        // span in three extra elements (a figure span, a line span and a token span),
        // which pushes a page past Babel's 500 KB deopt line in dev. The system's inline
        // pill styles plain <code>.
        bypassInlineCode: true,
      },
    ],
  ],
}
