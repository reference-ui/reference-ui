// MDX-scoped discovery tests: the noise stripper, the anchored matcher, and a
// scan-level decoy lock. They take MDX fixtures and assert the stripped text,
// the anchored pattern hits, and that a real top-level import is collected while
// a fence-only decoy carrying the same needle is not. The decoy proof is
// scan-level by construction: a compiled fence is an inert string, so the
// emitted sheet cannot distinguish a wrongly-collected decoy — the match set is
// where the guarantee lives.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { FRAGMENT_IMPORT_NEEDLES as NEEDLES } from '../../constants.ts'
import { releaseToken } from './helpers.ts'
import { createMdxImportPatterns, scanFragmentSources, stripMdxNoise } from './scanner.ts'
import { scanFragmentSourcesNative } from './native.ts'

const FENCE = '```'
const SYSTEM = '@reference-ui/system'

interface PatternLike {
  pattern: RegExp
}

function matches(patterns: PatternLike[], text: string): boolean {
  return patterns.some(({ pattern }) => pattern.test(text))
}

const REAL_DOC = [
  '---',
  'title: MDX fragments',
  '---',
  `import { font } from '${SYSTEM}'`,
  '',
  "export const display = font('display', { value: 'serif', fontFace: { src: 'url(/playfair.woff2)' }, weights: { normal: '400' } })",
  '',
  '# MDX doc',
  '',
  `${FENCE}ts`,
  `import { font } from '${SYSTEM}'`,
  FENCE,
  '',
].join('\n')

const DECOY_DOC = [
  '# Fence decoy',
  '',
  `${FENCE}ts`,
  `import { font } from '${SYSTEM}'`,
  `font('decoyface', { value: 'Decoy', fontFace: { src: 'url(/decoy.woff2)' }, weights: { normal: '400' } })`,
  FENCE,
  '',
].join('\n')

describe('stripMdxNoise', () => {
  it('blanks a leading frontmatter block', () => {
    expect(stripMdxNoise('---\ntitle: x\n---\n# hi')).toBe('\n\n\n# hi')
  })

  it('blanks backtick and tilde fences with their info strings', () => {
    expect(stripMdxNoise('a\n```ts\ncode\n```\nb')).toBe('a\n\n\n\nb')
    expect(stripMdxNoise('a\n~~~\ncode\n~~~\nb')).toBe('a\n\n\n\nb')
  })

  it('strips an unclosed fence to end of file', () => {
    expect(stripMdxNoise('a\n```\ncode\nmore')).toBe('a\n\n\n')
  })

  it('keeps a mid-document --- pair (a thematic break, not frontmatter)', () => {
    expect(stripMdxNoise('# a\n\n---\n\nkeep')).toBe('# a\n\n---\n\nkeep')
  })

  it('strips a leading BOM and blanks a CRLF fence', () => {
    expect(stripMdxNoise('\uFEFFx')).toBe('x')
    const crlf = stripMdxNoise(`a\r\n${FENCE}\r\nimport x from 'id'\r\n${FENCE}\r\nb`)
    expect(crlf.includes('import')).toBe(false)
    expect(crlf.includes('a')).toBe(true)
  })

  it('strips a frontmatter opener with trailing whitespace', () => {
    expect(stripMdxNoise('---  \ntitle: x\n---\n# hi')).toBe('\n\n\n# hi')
  })
})

describe('createMdxImportPatterns', () => {
  const patterns = createMdxImportPatterns([SYSTEM])

  it('matches single-line, multiline, and side-effect imports', () => {
    expect(matches(patterns, `import { font } from '${SYSTEM}'`)).toBe(true)
    expect(matches(patterns, `import {\n  font,\n  tokens\n} from '${SYSTEM}'`)).toBe(true)
    expect(matches(patterns, `import '${SYSTEM}'`)).toBe(true)
  })

  it('rejects prose that merely contains from the module id', () => {
    expect(matches(patterns, `the docs mention from '${SYSTEM}' in passing`)).toBe(false)
    expect(matches(patterns, `export { font } from '${SYSTEM}'`)).toBe(false)
  })

  it('does not span a blank line from a real import to prose', () => {
    expect(
      matches(patterns, `import x from 'other'\n\nsee from '${SYSTEM}' for details`),
    ).toBe(false)
  })

  it('matches a top-level import behind a stripped BOM', () => {
    expect(matches(patterns, stripMdxNoise(`\uFEFFimport '${SYSTEM}'`))).toBe(true)
  })

  it('never matches the fence-only decoy after stripping', () => {
    expect(matches(patterns, stripMdxNoise(DECOY_DOC))).toBe(false)
    expect(matches(patterns, stripMdxNoise(REAL_DOC))).toBe(true)
  })
})

describe('mdx scan decoy lock', () => {
  let root = ''

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'ref-md-scan-'))
    writeTree(root, {
      'theme/doc.mdx': REAL_DOC,
      'theme/decoy.mdx': DECOY_DOC,
    })
  })

  afterAll(() => {
    if (root !== '') rmSync(root, { recursive: true, force: true })
  })

  it('collects the real import and never the fence-only decoy', async () => {
    const { matches: found } = await scanFragmentSources({
      include: ['theme/**/*.{ts,tsx,mdx}'],
      importFrom: NEEDLES,
      cwd: root,
    })
    expect(found.map(path => relative(root, path)).sort()).toEqual(['theme/doc.mdx'])
  })

  it('native confirm selects the same real MDX match as the TS scan', async () => {
    const native = await scanFragmentSourcesNative({
      include: ['theme/**/*.{ts,tsx,mdx}'],
      importFrom: NEEDLES,
      cwd: root,
    })
    try {
      expect(native.matches.map(path => relative(root, path)).sort()).toEqual(['theme/doc.mdx'])
    } finally {
      await releaseToken(native.retention.token)
    }
  })
})

function writeTree(root: string, files: Record<string, string>): void {
  for (const [rel, content] of Object.entries(files)) {
    const full = join(root, rel)
    mkdirSync(dirname(full), { recursive: true })
    writeFileSync(full, content)
  }
}
