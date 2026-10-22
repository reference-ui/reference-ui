// Unit tests for the MDX tier and the collection check of the docs gate. It takes each check's module
// and fixture pages written to a temporary docs tree, with a collection config in the app's shape for the
// collection check to build, and asserts the findings by rule and line. The compile tests run the app's
// real pipeline, so they take a few seconds. Run with
// `pnpm --filter @reference-ui/reference-docs run quality:test`.
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { after, describe, it } from 'node:test'
import { collectionFindings } from './mdx-collection.mjs'
import { loadCompiler } from './mdx-compile.mjs'
import { compilePool } from './mdx-pool.mjs'
import { checkContract, parseFrontmatter } from './mdx-frontmatter.mjs'
import { linkFindings, linkTarget } from './mdx-links.mjs'
import { emDashLines } from './mdx-prose.mjs'
import { mdxTier } from './mdx.mjs'

const DASH = '—'
const PAGE = (fields, body = '# Title\n') => `---\n${fields}\n---\n\n${body}`
const VALID = 'title: Title\nsection: Guides\norder: 1\nslug: page\ndescription: A page.'
const withSlug = slug => VALID.replace('slug: page', `slug: ${slug}`)
const scratch = []

after(async () => {
  for (const dir of scratch) await rm(dir, { recursive: true, force: true })
})

/** Writes `files` into a temporary docs tree under src/content/docs. */
async function fixtureSite(files) {
  const docsDir = await mkdtemp(path.join(tmpdir(), 'mdx-gate-'))
  scratch.push(docsDir)
  const dir = path.join(docsDir, 'src/content/docs')
  await mkdir(dir, { recursive: true })
  for (const [name, text] of Object.entries(files)) await writeFile(path.join(dir, name), text)
  return { docsDir, dir }
}

/** Writes an earlier build's output into the app's output directory, listing `paths` in the shape content-collections emits. */
async function builtCollection(docsDir, paths) {
  const dir = path.join(docsDir, 'src/collections/.content-collections/generated')
  await mkdir(dir, { recursive: true })
  const docs = paths.map(p => ({ title: 'T', section: 'G', order: 1, slug: 's', description: 'd', path: p }))
  await writeFile(path.join(dir, 'allDocs.js'), `export default ${JSON.stringify(docs)}\n`)
  await writeFile(path.join(dir, 'index.js'), 'import allDocs from "./allDocs.js";\nexport { allDocs };\n')
}

/**
 * Writes the docs collection config in the app's shape: its paths, parser and schema. `guard` adds a
 * drop guard that throws after the build has written its output, as docs.ts does. `broken` makes the
 * config import a file that is not there.
 */
async function fixtureConfig(docsDir, { guard = false, broken = false } = {}) {
  const dir = path.join(docsDir, 'src/collections')
  await mkdir(dir, { recursive: true })
  const lines = [
    broken ? "import './not-there.ts'" : null,
    "import { defineCollection, defineConfig } from '@content-collections/core'",
    "import { z } from 'zod'",
    'const docs = defineCollection({',
    "  name: 'docs',",
    "  directory: '../content/docs',",
    "  include: '**/*.mdx',",
    "  parser: 'frontmatter-only',",
    '  schema: z.object({',
    '    title: z.string(),',
    '    section: z.string(),',
    '    order: z.number(),',
    '    slug: z.string(),',
    '    description: z.string(),',
    '  }),',
    `  transform: ({ _meta, ...doc }) => ({ ...doc, path: \`../content/docs/\${_meta.filePath}\` }),`,
    guard ? "  onSuccess: () => { throw new Error('a page was dropped') }," : null,
    '})',
    'export default defineConfig({ content: [docs] })',
  ]
  await writeFile(path.join(dir, 'content-collections.ts'), `${lines.filter(Boolean).join('\n')}\n`)
}

describe('frontmatter', () => {
  it('reads typed fields with their lines', () => {
    const fm = parseFrontmatter(PAGE(VALID))
    assert.deepEqual(fm.errors, [])
    assert.equal(fm.fields.get('order').type, 'number')
    assert.equal(fm.fields.get('order').value, 1)
    assert.equal(fm.fields.get('slug').line, 5)
    assert.equal(fm.bodyLine, 8)
    assert.deepEqual(checkContract(fm.fields), [])
  })

  it('fails on an unquoted colon in a value, with its line', () => {
    const fm = parseFrontmatter(PAGE(VALID.replace('A page.', 'Foo: bar')))
    assert.deepEqual(fm.errors, [
      {
        line: 6,
        message:
          '"description": a colon followed by a space ends the key; quote the value',
      },
    ])
  })

  it('accepts a quoted colon, drops a trailing comment, and reads an empty value as null', () => {
    const fm = parseFrontmatter(
      PAGE(
        VALID.replace('description: A page.', 'description: "Foo: bar" # note\ncomment: ')
      )
    )
    assert.deepEqual(fm.errors, [])
    assert.equal(fm.fields.get('description').value, 'Foo: bar')
    assert.equal(fm.fields.get('comment').type, 'null')
  })

  it('refuses a missing fence, an indented line, a duplicate key and a line with no key', () => {
    assert.equal(
      parseFrontmatter('# no frontmatter\n').errors[0].message,
      'the page must open with a --- frontmatter block'
    )
    assert.equal(
      parseFrontmatter('---\ntitle: x\n').errors[0].message,
      'the frontmatter block has no closing ---'
    )
    assert.match(
      parseFrontmatter(PAGE('title: x\n  more: y')).errors[0].message,
      /indented line/
    )
    assert.match(
      parseFrontmatter(PAGE('title: x\ntitle: y')).errors[0].message,
      /"title" is set twice/
    )
    assert.match(
      parseFrontmatter(PAGE('title:x')).errors[0].message,
      /expected "key: value"/
    )
  })

  it('does not report a key as missing when its own line already failed to parse', () => {
    const fm = parseFrontmatter(PAGE(VALID.replace('A page.', 'Foo: bar')))
    assert.equal(fm.errors.length, 1)
    assert.deepEqual(checkContract(fm.fields), [])
  })

  it('checks the contract: missing, mistyped and empty fields', () => {
    const missing = checkContract(
      parseFrontmatter(PAGE(VALID.replace('\ndescription: A page.', ''))).fields
    )
    assert.deepEqual(missing, [{ line: 1, message: 'missing "description"' }])
    const mistyped = checkContract(
      parseFrontmatter(PAGE(VALID.replace('order: 1', 'order: "1"'))).fields
    )
    assert.deepEqual(mistyped, [
      { line: 4, message: '"order" must be a number, found a string' },
    ])
    const empty = checkContract(
      parseFrontmatter(PAGE(VALID.replace('title: Title', 'title: ""'))).fields
    )
    assert.deepEqual(empty, [{ line: 2, message: '"title" must not be empty' }])
  })
})

describe('em dashes in prose', () => {
  const source = (lines, bodyLine = 1) => ({ text: lines.join('\n'), bodyLine })

  it('flags a dash in prose with its line', () => {
    const { text, bodyLine } = source(['# T', '', `Prose ${DASH} more.`], 1)
    assert.deepEqual(emDashLines(text, bodyLine), [3])
  })

  it('ignores fenced code, inline code and frontmatter', () => {
    const text = [
      '---',
      `title: a ${DASH} b`,
      '---',
      '```text',
      `inside ${DASH}`,
      '```',
      '~~~',
      `tilde ${DASH}`,
      '~~~',
      `Inline \`code ${DASH}\` is fine.`,
    ].join('\n')
    assert.deepEqual(emDashLines(text, 4), [])
  })

  it('exempts a placeholder cell but flags a dash between words in a table', () => {
    const text = [
      `| Name | Default |`,
      `| --- | --- |`,
      `| a | ${DASH} |`,
      `| b | c ${DASH} d |`,
    ].join('\n')
    assert.deepEqual(emDashLines(text, 1), [4])
  })
})

describe('internal links', () => {
  it('reads the target of each href and leaves external ones unchecked', () => {
    assert.deepEqual(linkTarget('/css#the-reset'), {
      self: false,
      slug: 'css',
      hash: 'the-reset',
    })
    assert.deepEqual(linkTarget('/'), { self: false, slug: 'initialize', hash: '' })
    assert.deepEqual(linkTarget('/tokens/?x=1'), {
      self: false,
      slug: 'tokens',
      hash: '',
    })
    assert.deepEqual(linkTarget('#usage'), { self: true, slug: null, hash: 'usage' })
    assert.equal(linkTarget('https://example.com/a'), null)
    assert.equal(linkTarget('//cdn.example.com/a.js'), null)
    assert.equal(linkTarget('relative/page'), null)
  })

  it('names a missing page, a missing anchor, and accepts known targets', async () => {
    const ctx = {
      selfSlug: 'here',
      slugs: new Set(['here', 'css']),
      headingsOf: async slug =>
        slug === 'css' ? new Set(['the-reset']) : new Set(['intro']),
    }
    const links = [
      { href: '/nope', line: 1 },
      { href: '/css#missing', line: 2 },
      { href: '/css#the-reset', line: 3 },
      { href: '#intro', line: 4 },
      { href: '#absent', line: 5 },
      { href: '/css#the%2Dreset', line: 6 },
    ]
    const found = await linkFindings(links, ctx)
    assert.deepEqual(
      found.map(f => [f.line, f.ruleId]),
      [
        [1, 'docs/link'],
        [2, 'docs/anchor'],
        [5, 'docs/anchor'],
      ]
    )
  })

  it('skips the anchor check when the target page cannot be read', async () => {
    const ctx = {
      selfSlug: 'here',
      slugs: new Set(['css']),
      headingsOf: async () => null,
    }
    assert.deepEqual(await linkFindings([{ href: '/css#anything', line: 1 }], ctx), [])
  })
})

describe('compile with the app pipeline', () => {
  it('captures heading ids as the components render them, and the links', async () => {
    const compiler = await loadCompiler()
    const source = [
      '---',
      VALID,
      '---',
      '',
      'import { Step } from "x"',
      '',
      '# T',
      '',
      '## Fonts',
      '',
      '### Usage',
      '',
      'See [a](/css#the-reset) and [b](#usage).',
      '',
      '## Tokens',
      '',
      '### Usage',
      '',
      '<Step n={1}>Install the packages</Step>',
      '',
      '<LinkCard href="/tokens#tones" />',
      '',
      '```md',
      '## Not a heading',
      '[x](/nope)',
      '```',
      '',
    ].join('\n')
    const result = await compiler.compile('/virtual/page.mdx', source)
    assert.equal(result.error, null)
    assert.deepEqual([...result.headings].sort(), [
      'fonts',
      'install-the-packages',
      'tokens',
      'tokens-usage',
      'usage',
    ])
    const lineOf = text => source.split('\n').findIndex(l => l.includes(text)) + 1
    assert.deepEqual(
      result.links.map(l => [l.href, l.line]),
      [
        ['/css#the-reset', lineOf('See [a]')],
        ['#usage', lineOf('See [a]')],
        ['/tokens#tones', lineOf('<LinkCard')],
      ]
    )
  })

  it('reports a syntax error at its line', async () => {
    const compiler = await loadCompiler()
    const result = await compiler.compile('/virtual/bad.mdx', '# Hi\n\n<Broken\n')
    assert.equal(result.error.line, 4)
    assert.match(result.error.message, /end of the tag|attribute/)
  })
})

describe('the MDX tier on a temporary docs tree', () => {
  it('reports each kind of finding on the page that holds it, and nothing on clean pages', async () => {
    const { docsDir } = await fixtureSite({
      'clean.mdx': PAGE(
        VALID.replace('slug: page', 'slug: clean'),
        '# Clean\n\nSee [css](/clean#clean).\n\n## Clean\n'
      ),
      'twin.mdx': PAGE(VALID.replace('slug: page', 'slug: clean')),
      'frontmatter.mdx': PAGE(
        VALID.replace('\ndescription: A page.', '\ndescription: Foo: bar'),
        '# F\n'
      ),
      'links.mdx': PAGE(
        VALID.replace('slug: page', 'slug: links'),
        `# L\n\n[a](/nope) [b](/clean#absent) ${DASH}\n`
      ),
      'syntax.mdx': PAGE(VALID.replace('slug: page', 'slug: syntax'), '# S\n\n<Broken\n'),
    })
    const result = await mdxTier({ docsDir, paths: [] })
    assert.equal(result.pages, 5)
    const found = result.errors.map(e => `${path.basename(e.file)} ${e.ruleId}`).sort()
    assert.deepEqual(found, [
      'clean.mdx docs/slug',
      'frontmatter.mdx docs/frontmatter',
      'links.mdx docs/anchor',
      'links.mdx docs/dash',
      'links.mdx docs/link',
      'syntax.mdx docs/mdx-compile',
      'twin.mdx docs/slug',
    ])
  })

  it('checks only the page named on the command line, and still resolves links from the collection', async () => {
    const { docsDir, dir } = await fixtureSite({
      'target.mdx': PAGE(
        VALID.replace('slug: page', 'slug: target'),
        '# T\n\n## Intro\n'
      ),
      'linker.mdx': PAGE(
        VALID.replace('slug: page', 'slug: linker'),
        `# L\n\n[ok](/target#intro) and [bad](/target#gone)\n`
      ),
    })
    const result = await mdxTier({ docsDir, paths: [path.join(dir, 'linker.mdx')] })
    assert.equal(result.pages, 1)
    assert.deepEqual(
      result.errors.map(e => [path.basename(e.file), e.ruleId]),
      [['linker.mdx', 'docs/anchor']]
    )
  })

  it('compiles on the worker pool and returns one result per page', async () => {
    const { dir } = await fixtureSite({
      'one.mdx': PAGE(VALID.replace('slug: page', 'slug: one')),
      'two.mdx': PAGE(VALID.replace('slug: page', 'slug: two'), '# Two\n\n## Here\n'),
      'three.mdx': PAGE(VALID.replace('slug: page', 'slug: three'), '<Broken\n'),
    })
    const files = ['one', 'two', 'three'].map(name => path.join(dir, `${name}.mdx`))
    const results = await compilePool(files, 2)
    assert.deepEqual([...results.keys()].sort(), files.slice().sort())
    assert.ok(results.get(files[2]).error.line > 1, 'the syntax error keeps its line')
    assert.deepEqual([...results.get(files[1]).headings], ['here'])
  })
})

describe('the collection check', () => {
  // The frontmatter's description has an unquoted colon, so content-collections drops the page.
  const DROPPED = PAGE(VALID.replace('slug: page', 'slug: dropped').replace('A page.', 'Foo: bar'))
  const CONFIG_FILE = docsDir => path.join(docsDir, 'src/collections/content-collections.ts')

  it('names the page the build drops, and only that page', async () => {
    const { docsDir } = await fixtureSite({ 'kept.mdx': PAGE(withSlug('kept')), 'dropped.mdx': DROPPED })
    await fixtureConfig(docsDir)
    const found = await collectionFindings({ docsDir })
    assert.deepEqual(found.map(f => [path.basename(f.file), f.line, f.ruleId]), [['dropped.mdx', 1, 'docs/collection']])
    assert.doesNotMatch(found[0].message, /sync/)
  })

  it('is clean when the build lists every page, and writes nothing into the app', async () => {
    const { docsDir } = await fixtureSite({ 'kept.mdx': PAGE(withSlug('kept')) })
    await fixtureConfig(docsDir)
    assert.deepEqual(await collectionFindings({ docsDir }), [])
    assert.equal(existsSync(path.join(docsDir, 'src/collections/.content-collections')), false)
  })

  it('names a dropped page, and does not repeat the build error that comes with it', async () => {
    const { docsDir } = await fixtureSite({ 'kept.mdx': PAGE(withSlug('kept')), 'dropped.mdx': DROPPED })
    await fixtureConfig(docsDir, { guard: true })
    const found = await collectionFindings({ docsDir })
    assert.deepEqual(found.map(f => [path.basename(f.file), f.ruleId]), [['dropped.mdx', 'docs/collection']])
  })

  it('reports a build error that names no page, with its first line', async () => {
    const { docsDir } = await fixtureSite({ 'kept.mdx': PAGE(withSlug('kept')) })
    await fixtureConfig(docsDir, { guard: true })
    assert.deepEqual(await collectionFindings({ docsDir }), [
      {
        file: CONFIG_FILE(docsDir),
        line: 1,
        ruleId: 'docs/collection',
        severity: 2,
        message: 'the docs collection did not build: a page was dropped',
      },
    ])
  })

  it('reports a config that does not load, rather than passing', async () => {
    // esbuild prints the unresolved import on stderr; a real run shows that line too.
    const { docsDir } = await fixtureSite({ 'kept.mdx': PAGE(withSlug('kept')) })
    await fixtureConfig(docsDir, { broken: true })
    const found = await collectionFindings({ docsDir })
    assert.equal(found.length, 1)
    assert.equal(found[0].file, CONFIG_FILE(docsDir))
    assert.match(found[0].message, /^the docs collection did not build: /)
  })

  it('reads this run, not an earlier build left in the app output', async () => {
    const { docsDir } = await fixtureSite({ 'kept.mdx': PAGE(withSlug('kept')), 'dropped.mdx': DROPPED })
    await builtCollection(docsDir, ['../content/docs/kept.mdx', '../content/docs/dropped.mdx'])
    await fixtureConfig(docsDir)
    const found = await collectionFindings({ docsDir })
    assert.deepEqual(found.map(f => path.basename(f.file)), ['dropped.mdx'])
    assert.ok(existsSync(path.join(docsDir, 'src/collections/.content-collections/generated/index.js')))
  })
})
