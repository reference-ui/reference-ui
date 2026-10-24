// Unit tests for the MDX tier: the app's real compile pipeline and the tier run over a temporary docs
// tree. The compile tests take a few seconds. Run with
// `pnpm --filter @reference-ui/reference-docs run quality:test`.
import assert from 'node:assert/strict'
import path from 'node:path'
import { after, describe, it } from 'node:test'
import { loadCompiler } from './mdx-compile.mjs'
import { compilePool } from './mdx-pool.mjs'
import { mdxTier } from './mdx.mjs'
import { DASH, PAGE, VALID, fixtureSite, removeFixtures } from './mdx-fixtures.mjs'

after(removeFixtures)

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
