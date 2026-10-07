// Unit tests for the Neo MDX esbuild loader.
// They compile a representative MDX source (frontmatter, top-level import and
// export, JSX, and a fence) through the plugin plus the react stub and assert
// the build resolves every emitted binding; a second case asserts a parse
// failure throws the named diagnostic instead of the legacy empty fallback.
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as esbuild from 'esbuild'
import { describe, expect, it } from 'vitest'
import { mdxPlugin } from './mdx.ts'
import { reactStubPlugin } from './react-stub.ts'

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
    const result = await esbuild.build({
      entryPoints: [file],
      bundle: true,
      format: 'esm',
      platform: 'node',
      jsx: 'automatic',
      write: false,
      external: ['@reference-ui/system'],
      plugins: [mdxPlugin(), reactStubPlugin()],
    })
    return result.outputFiles[0].text
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

describe('mdxPlugin', () => {
  it('bundles a representative MDX source and the react stub resolves every emitted binding', async () => {
    const output = await bundle(EXAMPLE)
    expect(output.length).toBeGreaterThan(0)
    expect(output).not.toMatch(/from\s+["']@mdx-js\/react["']/)
    expect(output).toContain('useMDXComponents')
  })

  it('throws a named diagnostic on a parse failure', async () => {
    await expect(bundle('# hi\n\n<div>\n')).rejects.toThrow(/mdx compile failed for .*doc\.mdx/)
  })
})
