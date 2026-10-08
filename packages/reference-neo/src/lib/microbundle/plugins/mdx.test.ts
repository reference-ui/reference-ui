// Unit tests for the Neo MDX esbuild loader.
// They compile a representative MDX source (frontmatter, top-level import and
// export, JSX, and a fence) through the production microbundle options and
// assert the react stub resolves every emitted binding; a second case asserts a
// parse failure throws the named diagnostic instead of the legacy empty
// fallback. Routing through microBundle also pins that the fragment path's
// automatic JSX never emits an unbound `React.createElement`.
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { microBundle } from '../microbundle.ts'

const FENCE = '```'
const EXAMPLE = [
  '---',
  'title: Example',
  '---',
  "import { font } from '@reference-ui/system'",
  '',
  "export const display = font('display', { value: 'serif', fontFace: { src: 'url(/x.woff2)' } })",
  '',
  '# Heading',
  '',
  `${FENCE}ts`,
  "import { font } from '@reference-ui/system'",
  FENCE,
  '',
].join('\n')

async function bundle(source: string): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), 'neo-mdx-plugin-'))
  const file = join(dir, 'doc.mdx')
  writeFileSync(file, source)
  try {
    return await microBundle(file, {
      reactStub: true,
      jsx: 'automatic',
      external: ['@reference-ui/system'],
    })
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

describe('mdxPlugin', () => {
  it('bundles a representative MDX source and the react stub resolves every emitted binding', async () => {
    const output = await bundle(EXAMPLE)
    expect(output.length).toBeGreaterThan(0)
    expect(output).not.toMatch(/from\s+["']@mdx-js\/react["']/)
    expect(output).not.toContain('React.createElement')
    expect(output).toContain('useMDXComponents')
  })

  it('throws a named diagnostic on a parse failure', async () => {
    await expect(bundle('# hi\n\n<div>\n')).rejects.toThrow(/mdx compile failed for .*doc\.mdx/)
  })
})
