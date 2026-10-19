/**
 * MDX conversion tests: `node --test .agents/docs-corpus/normalize/lib/*.test.mjs`.
 * Each case names one parser or renderer rule it proves.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { convertMdx, parseAttrs, stringList, stripModuleStatements } from './mdx.mjs'

const hooks = {
  Card: (props, children) => `<<${props.title ?? ''}:${children}>>`,
  Badge: (props, children, ctx) => `[${props.tone}${ctx.inline ? ' inline' : ''}]`,
}

describe('closers and nesting', () => {
  it('keeps the text after a same-line closer', () => {
    const { markdown } = convertMdx('<Card title="a">one</Card> tail\n', { components: hooks })
    assert.equal(markdown, '<<a:one>>\n\ntail\n')
  })

  it('pairs a nested tag of the same name by depth, with both closers on one line', () => {
    const src = '<Card title="outer">x <Card title="inner">y</Card> z</Card>\n'
    assert.equal(convertMdx(src, { components: hooks }).markdown, '<<outer:x <<inner:y>> z>>\n')
  })

  it('finds a closer in the middle of a line', () => {
    const src = '<Card title="a">first\nsecond </Card>after\n'
    assert.equal(convertMdx(src, { components: hooks }).markdown, '<<a:first\nsecond>>\n\nafter\n')
  })

  it('turns a stray closer and an unclosed opener into markers, keeping the text', () => {
    assert.equal(convertMdx('a </Nope> b\n').markdown, 'a <!-- unresolved: /Nope --> b\n')
    assert.equal(convertMdx('Before <Foo> after\n').markdown, 'Before <!-- unresolved: Foo --> after\n')
  })
})

describe('attributes and lists', () => {
  it('returns a {...} value as its raw expression, however deep', () => {
    assert.deepEqual(parseAttrs('data={{ a: {b: [1, { c: 2 }]} }} label="x" flag'), {
      data: '{ a: {b: [1, { c: 2 }]} }',
      label: 'x',
      flag: true,
    })
  })

  it('throws on an unbalanced expression', () => {
    assert.throws(() => parseAttrs('a={ {b: 1 }'), /unterminated/)
    assert.throws(() => parseAttrs('a={ b ] }'), /unbalanced/)
  })

  it('reads quoted, backtick and double-quoted strings in a list; refuses interpolation', () => {
    assert.deepEqual(stringList("[`alpha`, 'beta', \"gamma\"]"), ['alpha', 'beta', 'gamma'])
    assert.throws(() => stringList('[`a${x}`]'), /interpolation/)
  })
})

describe('hooks and fallbacks', () => {
  it('places an inline element through its hook, with ctx.inline set', () => {
    assert.equal(convertMdx('Hi <Badge tone="ok" /> there\n', { components: hooks }).markdown, 'Hi [ok inline] there\n')
  })

  it('falls back to the marker for an inline element no hook handles', () => {
    const { markdown, unresolved } = convertMdx('Hi <Badge tone="ok" /> there\n')
    assert.equal(markdown, 'Hi <!-- unresolved: Badge --> there\n')
    assert.equal(unresolved.get('Badge'), 1)
  })

  it('calls the hook once and keeps the children when the hook declines', () => {
    let calls = 0
    const decline = {
      Card: () => {
        calls++
        return null
      },
    }
    const { markdown, unresolved } = convertMdx('<Card title="t">body</Card>\n', { components: decline })
    assert.equal(calls, 1)
    assert.equal(markdown, '<!-- unresolved: Card -->\n\nbody\n')
    assert.equal(unresolved.get('Card'), 1)
  })

  it('names the component and the file when a hook throws', () => {
    const boom = {
      Card: () => {
        throw new Error('bad props')
      },
    }
    assert.throws(
      () => convertMdx('<Card title="t">x</Card>\n', { components: boom, file: '/x/page.mdx' }),
      /page\.mdx.*component Card.*bad props/
    )
  })

  it('counts unresolved markers from the finished output', () => {
    const { unresolved } = convertMdx('<Foo />\n\n<Foo />\n\n<Bar>x</Bar>\n')
    assert.equal(unresolved.get('Foo'), 2)
    assert.equal(unresolved.get('Bar'), 1)
  })
})

describe('module statements, comments and fences', () => {
  it('drops a multi-line import and keeps prose that starts with "import"', () => {
    const src = "import {\n  a,\n  b\n} from 'x'\n\nimport it from [a](b) instead.\n"
    assert.equal(convertMdx(src).markdown, 'import it from [a](b) instead.\n')
  })

  it('removes top-level exports but never lines inside a fence', () => {
    const out = stripModuleStatements("export const a = {\n  b: 1\n}\n\n```\nimport x from 'y'\n```\n")
    assert.ok(out.includes("import x from 'y'"))
    assert.ok(!out.includes('export const'))
  })

  it('keeps fenced code verbatim, blank runs included, and collapses blank runs outside it', () => {
    assert.equal(convertMdx('```\na\n\n\n\nb\n```\n\n\n\nafter\n').markdown, '```\na\n\n\n\nb\n```\n\nafter\n')
  })

  it('leaves JSX inside a fence alone', () => {
    const src = '```tsx\n<Card title="x">y</Card>\n```\n'
    assert.equal(convertMdx(src, { components: hooks }).markdown, src)
  })

  it('drops MDX comments', () => {
    assert.equal(convertMdx('a {/* hidden */} b\n').markdown, 'a  b\n')
  })

  it('makes root-relative links absolute outside code spans only', () => {
    const { markdown } = convertMdx('See [docs](/docs/x) and `[no](/docs/y)`.\n', { siteUrl: 'https://site.test' })
    assert.equal(markdown, 'See [docs](https://site.test/docs/x) and `[no](/docs/y)`.\n')
  })
})

describe('directives', () => {
  it('turns :::note into a labelled blockquote', () => {
    assert.equal(convertMdx(':::note\nBody line\n:::\n').markdown, '> **Note:** Body line\n')
  })

  it('uses a bracketed title as the label', () => {
    assert.equal(convertMdx(':::tip[Heads up]\nmore\n:::\n').markdown, '> **Heads up:** more\n')
  })

  it('keeps a fenced block inside a directive, quoted', () => {
    const src = ':::caution\n```bash\npnpm add x\n```\n:::\n'
    assert.equal(convertMdx(src).markdown, '> **Caution:**\n>\n> ```bash\n> pnpm add x\n> ```\n')
  })

  it('separates adjacent directives so they do not merge', () => {
    assert.equal(convertMdx(':::note\na\n:::\n:::tip\nb\n:::\n').markdown, '> **Note:** a\n\n> **Tip:** b\n')
  })
})

describe('block structure', () => {
  it('renders cards as links, tabs as labelled blocks, and callouts as blockquotes', () => {
    const src = [
      '<Cards>',
      '  <Card title="A" href="/docs/a" description="first" />',
      '  <Card title="B" href="/docs/b" description="second" />',
      '</Cards>',
      '',
      "<Tabs items={['pnpm', 'npm']}>",
      '  <Tab>',
      '    ```bash',
      '    pnpm i',
      '    ```',
      '  </Tab>',
      '  <Tab>',
      '    npm i',
      '  </Tab>',
      '</Tabs>',
      '',
      '<Callout type="warning">',
      '  Careful.',
      '</Callout>',
      '',
    ].join('\n')
    const { markdown } = convertMdx(src, { siteUrl: 'https://s.test' })
    assert.ok(markdown.includes('- [A](https://s.test/docs/a): first\n- [B](https://s.test/docs/b): second'))
    assert.ok(markdown.includes('**pnpm**\n\n```bash\npnpm i\n```'))
    assert.ok(markdown.includes('**npm**\n\nnpm i'))
    assert.ok(markdown.includes('> **Warning:** Careful.'))
  })
})
