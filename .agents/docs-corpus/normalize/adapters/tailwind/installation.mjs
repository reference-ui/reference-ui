/**
 * The installation pages and framework guides, built from their TSX as text.
 * Order follows the live Installation tabs (Using Vite, Using PostCSS, Tailwind
 * CLI, Framework Guides with its guides in index order, Play CDN). A tab page
 * renders its intro, Steps and Cta; a guide renders its notice and steps,
 * filtered by tab as the [...slug] route does. The TabBar and the sr-only
 * headings are navigation chrome, so they are not rendered.
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { cleanText, decodeEntities, readDefaultReturn, readExports, replaceBalancedBlock } from './jsx.mjs'
import { codeFence, codeSpan } from './markup.mjs'

const SITE = 'https://tailwindcss.com'
const INSTALL = 'src/app/(docs)/docs/installation'
const TABS = `${INSTALL}/(tabs)`
const GUIDES = `${INSTALL}/framework-guides`
const SECTION_GUIDES = 'Getting started / Installation / Framework guides'
const SECTION_TAB = 'Getting started / Installation'

const INLINE = new Set(['code', 'a', 'Link', 'em', 'strong', 'b', 'i', 'br', 'span'])
const TAB_PAGES = [
  { slug: 'installation', file: `${TABS}/using-vite/page.tsx`, section: 'Getting started', nav: true },
  { slug: 'installation/using-postcss', file: `${TABS}/using-postcss/page.tsx`, section: SECTION_TAB },
  { slug: 'installation/tailwind-cli', file: `${TABS}/tailwind-cli/page.tsx`, section: SECTION_TAB },
  { slug: 'installation/framework-guides', file: `${TABS}/framework-guides/page.tsx`, section: SECTION_TAB, guides: true },
  { slug: 'installation/play-cdn', file: `${TABS}/play-cdn/page.tsx`, section: SECTION_TAB },
]

const tidy = text => text.replace(/\s+/g, ' ').trim()

function fail(where, message) {
  throw new Error(`${where}: ${message}`)
}

/** A value read from source: an identifier resolves to the module export it names. */
function resolve(value, exports, where) {
  if (value && typeof value === 'object' && value.$ident !== undefined) {
    if (!(value.$ident in exports)) fail(where, `unknown identifier ${value.$ident}`)
    return exports[value.$ident]
  }
  return value
}

const absolute = href => (String(href).startsWith('/') ? `${SITE}${href}` : String(href))
const isInline = node => node.$text !== undefined || node.$expr !== undefined || INLINE.has(node.$jsx)
const isHidden = node =>
  node.attrs?.hidden === true || /(^|\s)sr-only(\s|$)/.test(String(node.attrs?.className ?? ''))

function inlineText(nodes, ctx) {
  return nodes.map(node => inlineNode(node, ctx)).join('')
}

function inlineNode(node, ctx) {
  if (node.$text !== undefined) return decodeEntities(cleanText(node.$text))
  if (node.$expr !== undefined) {
    if (typeof node.$expr === 'string') return node.$expr
    if (typeof node.$expr === 'number') return String(node.$expr)
    fail(ctx.where, `unsupported expression in text ${JSON.stringify(node.$expr)}`)
  }
  const { $jsx: tag, attrs = {}, children = [] } = node
  switch (tag) {
    case 'code':
      return codeSpan(tidy(inlineText(children, ctx)))
    case 'a':
    case 'Link':
      return `[${tidy(inlineText(children, ctx))}](${absolute(attrs.href)})`
    case 'em':
    case 'i':
      return `*${tidy(inlineText(children, ctx))}*`
    case 'strong':
    case 'b':
      return `**${tidy(inlineText(children, ctx))}**`
    case 'span':
      return inlineText(children, ctx)
    case 'br':
      return ' '
    default:
      return fail(ctx.where, `unsupported inline element <${tag}>`)
  }
}

/** The blocks (paragraphs, lists, steps, notes) that a run of JSX nodes renders to. */
function blocksOf(nodes, ctx) {
  const out = []
  let run = []
  const flush = () => {
    const text = tidy(inlineText(run, ctx))
    if (text) out.push(text)
    run = []
  }
  for (const node of nodes) {
    if (isInline(node)) {
      run.push(node)
      continue
    }
    flush()
    if (isHidden(node) || node.$jsx === 'TabBar') continue
    out.push(...blockOf(node, ctx))
  }
  flush()
  return out
}

function blockOf(node, ctx) {
  const { $jsx: tag, attrs = {}, children = [] } = node
  switch (tag) {
    case 'p': {
      const text = tidy(inlineText(children, ctx))
      return text ? [text] : []
    }
    case '':
    case 'div':
    case 'section':
      return blocksOf(children, ctx)
    case 'ul':
    case 'ol': {
      // A list of items becomes Markdown items; any other child (a generated tile list) renders as it is.
      if (!children.some(child => child.$jsx === 'li')) return blocksOf(children, ctx)
      const items = children.filter(child => child.$jsx === 'li')
      const lines = items.map((item, index) => {
        const marker = tag === 'ol' ? `${index + 1}.` : '-'
        return `${marker} ${tidy(inlineText(item.children, ctx))}`
      })
      return [lines.join('\n')]
    }
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      return [`${'#'.repeat(Number(tag[1]))} ${tidy(inlineText(children, ctx))}`]
    case 'blockquote':
      return blocksOf(children, ctx).map(block => block.split('\n').map(line => `> ${line}`).join('\n'))
    case 'Cta': {
      const label = attrs.label ? [`[${attrs.label}](${absolute(attrs.href ?? '')})`] : []
      return [...blocksOf(children, ctx), ...label]
    }
    case 'Steps':
      return stepBlocks(resolve(attrs.steps, ctx.exports, ctx.where), ctx)
    case 'GuideTiles':
      return [guideTiles(ctx)]
    default:
      return fail(ctx.where, `unsupported block element <${tag}>`)
  }
}

/** One step: its title as a section heading, its body, the code's label, and the code. */
function stepBlocks(steps, ctx) {
  return steps.flatMap(step => {
    const bodyNodes = step.body.$jsx === '' ? step.body.children : [step.body]
    const blocks = [`## ${tidy(step.title)}`, ...blocksOf(bodyNodes, ctx)]
    if (step.code.name) blocks.push(`**${step.code.name}**`)
    blocks.push(codeFence(step.code.lang, step.code.code))
    return blocks
  })
}

/** The guide tiles on the Framework Guides page: each links to the guide's first page. */
function guideTiles(ctx) {
  return ctx.guides
    .map(guide => {
      const first = guide.tabs?.length ? `${guide.slug}/${guide.tabs[0].slug}` : guide.slug
      return `- [${guide.tile.title}](${SITE}/docs/installation/framework-guides/${first}): ${guide.tile.description}`
    })
    .join('\n')
}

/** The guide files in the order the framework-guides index lists them, from its import map. */
function loadGuides(root) {
  const index = readFileSync(join(root, GUIDES, 'index.ts'), 'utf8')
  const guides = []
  for (const m of index.matchAll(/["']?([\w-]+)["']?:\s*\(\)\s*=>\s*import\("\.\/([\w-]+)"\)/g)) {
    const file = join(root, GUIDES, `${m[2]}.tsx`)
    const exports = readExports(readFileSync(file, 'utf8'))
    guides.push({ slug: m[1], file, tile: exports.tile, page: exports.page, steps: exports.steps, tabs: exports.tabs, notice: exports.page?.notice })
  }
  return guides
}

/** The default export's JSX as blocks, with the framework-guides list replaced by its tile list. */
function tabBody(root, relFile, exports, ctx) {
  let src = readFileSync(join(root, relFile), 'utf8')
  if (src.includes('{guides.map(')) src = replaceBalancedBlock(src, src.indexOf('{guides.map('), '<GuideTiles />')
  const jsx = readDefaultReturn(src)
  if (!jsx) throw new Error(`${relFile}: no default export return`)
  return blocksOf(jsx.$jsx === '' ? jsx.children : [jsx], { ...ctx, exports, where: relFile })
}

/** The blocks that repeat the description are dropped: the runner writes the description itself. */
function withoutDescription(blocks, description) {
  const text = tidy(description)
  return blocks.filter(block => tidy(block) !== text)
}

function guideBody(guide, tabSlug, ctx) {
  const blocks = []
  if (guide.notice) blocks.push(...blocksOf(guide.notice.$jsx === '' ? guide.notice.children : [guide.notice], { ...ctx, exports: {}, where: guide.slug }).map(block => block.split('\n').map(line => `> ${line}`).join('\n')))
  const steps = guide.steps.filter(step => !step.tabs || (tabSlug !== undefined && step.tabs.includes(tabSlug)))
  blocks.push(...stepBlocks(steps, { ...ctx, exports: {}, where: guide.slug }))
  return blocks.join('\n\n')
}

/**
 * The installation pages and the framework guides, in live tab order. Each
 * page is { slug, title, description, url, section, type, path, file, format: 'md', text }.
 * `titleFor` gives the nav title for the page that the nav config lists.
 */
export function installationPages(root, { siteUrl = SITE } = {}) {
  const ctx = { siteUrl, guides: [], where: '' }
  const guides = loadGuides(root)
  ctx.guides = guides
  const pages = []
  const report = []

  for (const tab of TAB_PAGES) {
    const file = join(root, tab.file)
    if (!existsSync(file)) throw new Error(`missing ${tab.file}`)
    const src = readFileSync(file, 'utf8')
    const exports = readExports(src)
    const meta = exports.metadata
    if (!meta || typeof meta.title !== 'string') throw new Error(`${tab.file}: metadata title is not a string`)
    const description = String(meta.description ?? '')
    const blocks = withoutDescription(tabBody(root, tab.file, exports, { ...ctx, where: tab.file }), description)
    pages.push({
      slug: tab.slug,
      title: tab.nav ? 'Installation' : meta.title,
      description,
      url: meta.openGraph?.url ?? `${siteUrl}/docs/${tab.slug}`,
      section: tab.section,
      type: 'install',
      path: `vendor/docs/tailwind/${tab.file}`,
      file,
      format: 'md',
      text: blocks.join('\n\n'),
    })
    if (tab.guides) {
      for (const guide of guides) {
        const variants = guide.tabs?.length ? guide.tabs.map(t => t.slug) : [undefined]
        for (const tabSlug of variants) {
          const slug = tabSlug ? `installation/framework-guides/${guide.slug}/${tabSlug}` : `installation/framework-guides/${guide.slug}`
          const title = guide.page.title
          pages.push({
            slug,
            title,
            description: String(guide.page.description),
            url: `${siteUrl}/docs/installation/framework-guides/${guide.slug}${tabSlug ? `/${tabSlug}` : ''}`,
            section: SECTION_GUIDES,
            type: 'install',
            path: `vendor/docs/tailwind/${relative(GUIDES, guide.file)}`,
            file: guide.file,
            format: 'md',
            text: guideBody(guide, tabSlug, { ...ctx, where: guide.slug }),
          })
        }
      }
    }
  }
  report.push(`installation: ${pages.length} pages from the TSX (tabs, framework guides and their tabs)`)
  return { pages, report }
}

/** A path relative to a directory, for the repo-relative `path` field. */
function relative(dir, file) {
  const at = file.indexOf(dir)
  return at === -1 ? file : file.slice(at)
}
