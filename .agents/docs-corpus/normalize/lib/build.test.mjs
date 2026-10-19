/**
 * Build tests: layout, output-path clashes, provenance overrides and the
 * adapter contract. `node --test .agents/docs-corpus/normalize/lib/*.test.mjs`
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildSource, checkPage } from './build.mjs'

const entry = { name: 'src', repo: 'https://example.test/src', commit: 'c0ffee', license: 'MIT' }

/** A valid adapter page; `extra` overrides any field. Markdown format keeps the test free of JSX. */
const page = (slug, extra = {}) => ({
  slug,
  title: slug,
  description: '',
  url: `https://example.test/${slug}`,
  section: 'Section',
  type: 'guide',
  path: `vendor/docs/src/${slug}.mdx`,
  file: `/abs/src/${slug}.mdx`,
  format: 'md',
  text: '## Getting started\n\nHello.\n',
  ...extra,
})

describe('layout', () => {
  it('keeps a parent section and a child page with the same slug apart', () => {
    const built = buildSource({
      name: 'src',
      entry,
      pages: [
        page('registry', { text: '## Getting started\n\nParent.\n' }),
        page('registry/getting-started', { text: 'Child.\n' }),
      ],
    })
    const rels = built.files.map(f => f.rel)
    assert.ok(rels.includes('src/registry.md'))
    assert.ok(rels.includes('src/registry.sections/getting-started.md'))
    assert.ok(rels.includes('src/registry/getting-started.md'))
    assert.equal(new Set(rels).size, rels.length)
  })

  it('keeps section ids unchanged by the layout', () => {
    const built = buildSource({
      name: 'src',
      entry,
      pages: [page('registry', { text: '## Getting started\n\nParent.\n' })],
    })
    assert.deepEqual(built.rows[0].sections, ['src:registry#getting-started'])
    const sectionText = built.files.find(f => f.rel === 'src/registry.sections/getting-started.md').text
    assert.ok(sectionText.includes('id: src:registry#getting-started'))
  })

  it('fails loudly when two outputs share a path', () => {
    assert.throws(
      () =>
        buildSource({
          name: 'src',
          entry,
          pages: [
            page('registry', { text: '## Getting started\n\nx\n' }),
            page('registry.sections/getting-started', { text: 'y\n' }),
          ],
        }),
      /output path clash on 'src\/registry\.sections\/getting-started\.md'/
    )
  })

  it('treats paths that differ only in case as one path', () => {
    assert.throws(
      () => buildSource({ name: 'src', entry, pages: [page('Guide', { text: 'a\n' }), page('guide', { text: 'b\n' })] }),
      /compared case-insensitively/
    )
  })
})

describe('provenance', () => {
  it('takes repo, commit and license from the page when it overrides them', () => {
    const built = buildSource({
      name: 'src',
      entry,
      pages: [
        page('a', { repo: 'https://example.test/other', commit: 'abc123', license: 'Apache-2.0' }),
        page('b'),
      ],
    })
    const [a, b] = built.rows
    assert.deepEqual([a.repo, a.commit, a.license], ['https://example.test/other', 'abc123', 'Apache-2.0'])
    assert.deepEqual([b.repo, b.commit, b.license], ['https://example.test/src', 'c0ffee', 'MIT'])
    const text = built.files.find(f => f.rel === 'src/a.md').text
    assert.ok(text.includes('repo: https://example.test/other'))
    assert.ok(text.includes('commit: abc123'))
  })

  it('refuses an empty provenance override', () => {
    assert.throws(() => checkPage({ ...page('x'), commit: '' }, 'src', new Set()), /commit must be a non-empty string/)
  })
})

describe('adapter contract', () => {
  it('rejects a type outside the list, a relative file, and frontmatter in text', () => {
    assert.throws(() => checkPage({ ...page('x'), type: 'tutorial' }, 'src', new Set()), /type 'tutorial'/)
    assert.throws(() => checkPage({ ...page('y'), file: 'rel/y.mdx' }, 'src', new Set()), /absolute file path/)
    assert.throws(
      () => checkPage({ ...page('z'), text: '---\ntitle: x\n---\nbody' }, 'src', new Set()),
      /frontmatter in text/
    )
  })

  it('rejects a repeated slug within one source', () => {
    assert.throws(() => buildSource({ name: 'src', entry, pages: [page('dup'), page('dup')] }), /repeats a slug/)
  })

  it('applies directives to Markdown pages too', () => {
    const built = buildSource({ name: 'src', entry, pages: [page('m', { text: ':::tip\nKeep it short.\n:::\n' })] })
    assert.ok(built.files[0].text.includes('> **Tip:** Keep it short.'))
  })

  it('numbers pages in nav order and lists each section under its page', () => {
    const built = buildSource({
      name: 'src',
      entry,
      pages: [page('first', { text: '## A\n\nx\n## B\n\ny\n' }), page('second')],
    })
    assert.deepEqual(
      built.rows.map(r => r.order),
      [1, 2]
    )
    assert.equal(built.rows[0].sections.length, 2)
    assert.equal(built.sections, 3)
  })
})
