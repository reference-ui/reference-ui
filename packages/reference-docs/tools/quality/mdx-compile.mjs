// MDX compile for the docs gate. It takes a page path and source, and emits the compile error the
// app would raise plus the heading ids and link targets its tree renders. It compiles with the
// app's own pipeline (src/mdx/pipeline.ts, loaded as TypeScript by Node) through the
// @mdx-js/rollup plugin the Vite config uses. A capture plugin appended to that list reads the
// finished tree and changes nothing.
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const DOCS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const HEADING = /^h[23]$/
const JSX_ELEMENT = new Set(['mdxJsxFlowElement', 'mdxJsxTextElement'])

/** Loads the compiler once. It throws when the plugin or the TypeScript pipeline cannot load. */
export async function loadCompiler() {
  const rollup = (await import('@mdx-js/rollup')).default
  const pipeline = await import(
    pathToFileURL(path.join(DOCS_DIR, 'src/mdx/pipeline.ts')).href
  )
  const { slugify } = await import(
    pathToFileURL(path.join(DOCS_DIR, 'src/mdx/slug.ts')).href
  )
  const captured = new Map()
  // A transformer must return nothing: a returned value replaces the tree.
  const capture = () => (tree, file) => {
    captured.set(file.path, collectPage(tree, slugify))
  }
  const options = pipeline.mdxOptions
  const plugin = rollup({
    ...options,
    rehypePlugins: [...options.rehypePlugins, capture],
  })
  return {
    /** Compiles one page; `error` is set when the pipeline rejects it, else `headings` and `links`. */
    async compile(file, source) {
      captured.delete(file)
      try {
        await plugin.transform(source, file)
      } catch (err) {
        return { error: errorOf(err), headings: null, links: null }
      }
      const page = captured.get(file)
      if (!page)
        return {
          error: { line: 1, message: 'the pipeline produced no tree' },
          headings: null,
          links: null,
        }
      return { error: null, headings: page.headings, links: page.links }
    },
  }
}

function errorOf(err) {
  const line = Number.isInteger(err?.line) && err.line > 0 ? err.line : 1
  return { line, message: String(err?.reason ?? err?.message ?? err).split('\n')[0] }
}

/** Heading ids and links of a compiled page, mirroring what the components render. */
function collectPage(tree, slugify) {
  const page = { headings: new Set(), links: [] }
  visit(tree, node => collectNode(node, page, slugify))
  return page
}

function collectNode(node, page, slugify) {
  if (node.type === 'element') collectElement(node, page, slugify)
  else if (JSX_ELEMENT.has(node.type)) collectJsx(node, page, slugify)
}

function collectElement(node, page, slugify) {
  if (node.tagName === 'a' && typeof node.properties?.href === 'string') {
    page.links.push({ href: node.properties.href, line: lineOf(node) })
  }
  if (HEADING.test(node.tagName))
    page.headings.add(node.properties?.id ?? slugify(textOf(node)))
}

function collectJsx(node, page, slugify) {
  addJsxHeading(node, slugify, page.headings)
  const href = jsxLiteral(node, 'href')
  if (href !== undefined) page.links.push({ href, line: lineOf(node) })
}

/** `<Step>` derives its id from its text; a raw `<h2>` or `<h3>` takes an `id` attribute if it has one. */
function addJsxHeading(node, slugify, headings) {
  if (node.name === 'Step') headings.add(slugify(textOf(node)))
  else if (node.name === 'h2' || node.name === 'h3')
    headings.add(jsxLiteral(node, 'id') ?? slugify(textOf(node)))
}

/** The string a JSX attribute holds, or `undefined` when it is not a plain literal. */
function jsxLiteral(node, name) {
  const attr = (node.attributes ?? []).find(
    a => a.type === 'mdxJsxAttribute' && a.name === name
  )
  if (!attr) return undefined
  if (typeof attr.value === 'string') return attr.value
  const expression = typeof attr.value?.value === 'string' ? attr.value.value.trim() : ''
  const quoted = /^(['"`])([\s\S]*)\1$/.exec(expression)
  return quoted ? quoted[2] : undefined
}

function visit(node, fn) {
  fn(node)
  for (const child of node.children ?? []) visit(child, fn)
}

function textOf(node) {
  if (node.type === 'text') return node.value ?? ''
  return (node.children ?? []).map(textOf).join('')
}

function lineOf(node) {
  return node.position?.start?.line ?? 1
}
