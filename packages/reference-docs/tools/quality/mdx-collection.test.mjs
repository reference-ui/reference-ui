// Unit tests for the collection check of the docs gate.
// Each test builds a temporary docs tree with a collection config in the app's shape and asserts which
// dropped pages and config failures the check reports. Run with
// `pnpm --filter @reference-ui/reference-docs run quality:test`.
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { after, describe, it } from 'node:test'
import { collectionTier } from './mdx-collection.mjs'
import { PAGE, VALID, builtCollection, fixtureConfig, fixtureSite, removeFixtures, withSlug } from './mdx-fixtures.mjs'

after(removeFixtures)

describe('the collection check', () => {
  const collectionFindings = async ({ docsDir }) => (await collectionTier({ docsDir })).errors
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
