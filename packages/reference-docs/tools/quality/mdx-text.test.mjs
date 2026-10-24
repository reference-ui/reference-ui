// Unit tests for the MDX gate's text checks: frontmatter parsing and contract, em dashes in prose, and
// internal link targets. They run each check's module on strings, with no docs tree. Run with
// `pnpm --filter @reference-ui/reference-docs run quality:test`.
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { checkContract, parseFrontmatter } from './mdx-frontmatter.mjs'
import { linkFindings, linkTarget } from './mdx-links.mjs'
import { emDashLines } from './mdx-prose.mjs'
import { DASH, PAGE, VALID } from './mdx-fixtures.mjs'

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
