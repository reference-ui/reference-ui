/**
 * Chakra UI adapter. The docs page list, titles, sections and order come from
 * the site's nav config (`apps/www/docs.config.ts`): each leaf is a page at
 * `/docs/<group urls>/<leaf url>`, with its source at
 * `apps/www/content/docs/<same path>.mdx`. Blog posts and guides are not in the
 * docs nav, but the site's top navigation links both sections, so they are
 * included with their own types. Spotlight, Showcase and the codemod package
 * docs are not docs pages and are reported, not included. Demos are inlined from
 * `apps/compositions/src/examples/`. Props tables come from
 * `llms/llms-full.txt`, the site's own text for those pages; a page whose tables
 * do not line up with its PropTable tags falls back to a one-line note.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { stripTypeScriptTypes } from 'node:module'
import { parseFrontmatter } from '../lib/frontmatter.mjs'
import { prepareChakraMdx, proseMask } from './chakra/directives.mjs'
import { h2Sequence, llmsBlocks, propSlots } from './chakra/llms.mjs'

const SOURCE = 'chakra'
const CONTENT = 'apps/www/content'
const EXAMPLES = 'apps/compositions/src/examples'
const NOT_IN_CLONE = 'The site builds this at build time from data this clone does not include.'

/** Pages in the nav with a fixed type; everything else is typed by its tab and group. */
const TYPE_BY_SLUG = {
  'get-started/installation': 'install',
  'get-started/migration': 'migration',
  'get-started/cli': 'api-reference',
  'charts/installation': 'install',
  'charts/use-chart': 'api-reference',
  'components/concepts/testing': 'guide',
}

/** A docs page's type from its slug, then its nav tab and group. */
function typeOf(slug, group) {
  if (Object.hasOwn(TYPE_BY_SLUG, slug)) return TYPE_BY_SLUG[slug]
  const tab = slug.split('/')[0]
  if (tab === 'get-started') {
    if (group === 'Frameworks') return 'install'
    if (group === 'AI for Agents') return 'ai'
    return 'guide'
  }
  if (tab === 'components') return group === 'Concepts' ? 'concept' : 'component'
  if (tab === 'charts') return 'component'
  if (tab === 'styling') return group === 'Style Props' ? 'api-reference' : 'concept'
  if (tab === 'theming') return 'theming'
  return 'other'
}

/** Nav module, with its TypeScript types stripped and no external imports. */
async function loadNav(file) {
  const js = stripTypeScriptTypes(readFileSync(file, 'utf8'))
  return import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'))
}

/** Parse a page's frontmatter: its data and its body (no frontmatter). */
function readPage(file) {
  return parseFrontmatter(readFileSync(file, 'utf8'))
}

function mdxFiles(dir, base = dir, out = []) {
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) mdxFiles(full, base, out)
    else if (name.endsWith('.mdx')) out.push(full.slice(base.length + 1).replace(/\.mdx$/, ''))
  }
  return out
}

/** Leaves of the docs tab: { slug, title, group, top }. External links are counted apart. */
function docsLeaves(tab, report) {
  const leaves = []
  const external = []
  const walk = (nodes, parts, top, group) => {
    for (const node of nodes) {
      if (node.external || /^(https?:|\/)/.test(node.url ?? '')) {
        external.push(node.title)
        continue
      }
      if (Array.isArray(node.items)) {
        // A node with a url adds a path segment for its children; a node without one only groups them.
        const childParts = node.url ? [...parts, node.url] : parts
        if (top === null) walk(node.items, childParts, node.title, null)
        else walk(node.items, childParts, top, node.title)
        continue
      }
      if (!node.url) {
        report.push(`nav item with no url: ${node.title}`)
        continue
      }
      leaves.push({ slug: [...parts, node.url].join('/'), title: node.title, top, group })
    }
  }
  walk(tab.items, [], null, null)
  return { leaves, external }
}

/** Count tags that start a line outside fenced code, the way the converter sees block elements. */
function countBlockTags(text, name) {
  const prose = proseMask(text)
  const re = new RegExp(`^\\s*<${name}(\\s|/|>|$)`)
  return text.split('\n').filter((line, i) => prose[i] && re.test(line)).length
}

/** Props-table slots for each docs page, filled in collect() and read by the PropTable hook. */
const propTables = new Map()
const propCursor = new Map()

/** The TSX fence for an examples/ demo, or null when the clone has no such file. */
function demoFence(name, ctx) {
  if (typeof name !== 'string' || !name) return null
  const source = ctx.readImport(join(ctx.root, EXAMPLES, name))
  if (source == null) return null
  const code = source.replace(/\n$/, '')
  const ticks = code.includes('```') ? '````' : '```'
  return [`${ticks}tsx`, code, ticks].join('\n')
}

function demoHook(props, children, ctx) {
  return demoFence(props.name, ctx)
}

function snippetHook(props, children, ctx) {
  return demoFence(props.name, ctx) ?? `> Code: the closed composition for ${props.name}. ${NOT_IN_CLONE}`
}

/** `Toast Root`, `Toaster`: the component and its part, as the site names them. */
function partLabel(props) {
  const component = String(props.component ?? '')
  const part = String(props.part ?? '')
  return part && part !== component ? `${component} ${part}` : component
}

function propTableHook(props, children, ctx) {
  const k = propCursor.get(ctx.file) ?? 0
  propCursor.set(ctx.file, k + 1)
  const table = propTables.get(ctx.file)?.[k]
  if (typeof table === 'string') return table
  return `> Table: lists the props of ${partLabel(props)}. ${NOT_IN_CLONE}`
}

/** An absolute URL for a site path, using the site origin. */
function absoluteUrl(path, siteUrl) {
  return path.startsWith('/') && siteUrl ? `${siteUrl}${path}` : path
}

const TOKEN_DOCS = [
  'AspectRatioTokenDoc', 'BorderRadiusTokenDoc', 'BreakpointDoc', 'ColorSemanticTokenDoc', 'ColorTokenDoc',
  'ConditionalStylesReferenceDoc', 'CursorTokenDoc', 'DurationTokenDoc', 'FontSizeTokenDoc', 'FontTokenDoc',
  'FontWeightTokenDoc', 'KeyframeDoc', 'LetterSpacingTokenDoc', 'LineHeightTokenDoc', 'ShadowTokenDoc',
  'SizesTokenDoc', 'SpacingTokenDoc', 'ZIndexTokenDoc',
]

export const components = {
  ExampleTabs: demoHook,
  Explorer: demoHook,
  ExampleCode: demoHook,
  ExamplePreview: demoHook,
  Example: demoHook,
  SnippetCode: snippetHook,
  PropTable: propTableHook,
  Box: (props, children) => children,
  CodeGroup: (props, children) => children,
  Image(props, children, ctx) {
    const src = typeof props.src === 'string' ? absoluteUrl(props.src, ctx.siteUrl) : ''
    const alt = typeof props.alt === 'string' ? props.alt : ''
    return src ? `![${alt}](${src})` : null
  },
  Video(props, children, ctx) {
    const src = typeof props.src === 'string' ? absoluteUrl(props.src, ctx.siteUrl) : ''
    return src ? `> Video: ${src}` : null
  },
  FeaturedVideo: () => `> Video: the site's featured video. ${NOT_IN_CLONE}`,
  Iframe(props) {
    const title = typeof props.title === 'string' ? props.title : 'video'
    const src = typeof props.src === 'string' ? props.src : ''
    return src ? `> Embed: ${title} (${src})` : null
  },
  ResourceCard(props) {
    const url = typeof props.url === 'string' ? props.url : ''
    if (!url) return null
    const title = typeof props.title === 'string' ? props.title : ''
    const type = typeof props.type === 'string' ? ` (${props.type})` : ''
    const description = typeof props.description === 'string' && props.description ? `: ${props.description}` : ''
    return `- [${title}](${url})${type}${description}`
  },
  ComponentGrid: () => `> Grid: lists the library's components. ${NOT_IN_CLONE}`,
}
for (const name of TOKEN_DOCS) {
  components[name] = () => `> Table: generated ${name} output. ${NOT_IN_CLONE}`
}

/** Blog posts and guides: frontmatter, then the body with its directives converted. */
function sectionPage({ slug, file, path, type, section, fallbackTitle }, siteUrl, url) {
  const { data, body } = readPage(file)
  return {
    slug,
    title: data.title || fallbackTitle,
    description: data.description ?? '',
    url,
    section,
    type,
    path,
    file,
    format: 'mdx',
    text: prepareChakraMdx(body, { siteUrl }),
    publishedAt: data.publishedAt ?? '',
    collection: data.collection ?? '',
    releaseType: data.type ?? '',
  }
}

const PROP_TAG = /^\s*<PropTable(\s|\/|>|$)/

/**
 * For each PropTable tag in document order: true when the page already has an
 * H3-or-deeper heading directly above it. The llms text repeats that heading,
 * so the table then needs none of its own; a tag without one takes the site's
 * generated `### <part>` label instead.
 */
function mdxSubheadings(text) {
  const lines = text.split('\n')
  const prose = proseMask(text)
  const flags = []
  lines.forEach((line, i) => {
    if (!prose[i] || !PROP_TAG.test(line)) return
    let k = i - 1
    while (k >= 0 && lines[k].trim() === '') k--
    flags.push(k >= 0 && /^#{3,6}\s/.test(lines[k]))
  })
  return flags
}

/** Props tables for one docs page, as Markdown per tag (null for a raw tag), or a reason it fell back to notes. */
function propTablesFor(page, blocks) {
  const h2 = h2Sequence(page.body.split('\n'))
  const matches = blocks.filter(block => block.title === page.title && h2Sequence(block.lines) === h2)
  if (matches.length !== 1) return { reason: matches.length ? 'more than one llms block' : 'no llms block' }
  const parsed = propSlots(matches[0].lines)
  if (parsed.length !== page.propCount) {
    return { reason: `llms-full has ${parsed.length} props slots, page has ${page.propCount} PropTable tags` }
  }
  const flags = mdxSubheadings(page.text)
  const slots = parsed.map((slot, k) => {
    if (slot === null) return null
    return flags[k] || !slot.heading ? slot.table : `${slot.heading}\n\n${slot.table}`
  })
  return { slots }
}

export default {
  source: SOURCE,

  async collect({ vendorDir, entry }) {
    const root = join(vendorDir, SOURCE)
    const content = join(root, CONTENT)
    const nav = await loadNav(join(root, 'apps/www/docs.config.ts'))
    const { docsConfig } = nav
    const siteUrl = docsConfig.url.replace(/\/+$/, '')
    const report = []
    propTables.clear()
    propCursor.clear()

    // Docs tab: the page list, in nav order.
    const docsTab = docsConfig.navigation.find(item => item.url === 'docs')
    if (!docsTab) throw new Error('docs.config.ts has no top-level "docs" nav item')
    const { leaves, external } = docsLeaves(docsTab, report)
    const docsDir = join(content, 'docs')
    const inNav = new Set()
    const docs = []
    for (const leaf of leaves) {
      if (inNav.has(leaf.slug)) continue
      inNav.add(leaf.slug)
      const file = join(docsDir, `${leaf.slug}.mdx`)
      if (!existsSync(file)) {
        report.push(`nav without content: ${leaf.title} (${leaf.slug})`)
        continue
      }
      const { data, body } = readPage(file)
      const path = `vendor/docs/${SOURCE}/${CONTENT}/docs/${leaf.slug}.mdx`
      docs.push({
        slug: leaf.slug,
        title: data.title || leaf.title,
        description: data.description ?? '',
        url: `${siteUrl}/docs/${leaf.slug}`,
        section: leaf.group ? `${leaf.top} / ${leaf.group}` : leaf.top,
        type: typeOf(leaf.slug, leaf.group),
        path,
        file,
        format: 'mdx',
        body,
        text: prepareChakraMdx(body, { siteUrl }),
      })
    }
    report.push(`nav: ${docs.length} docs pages; external links skipped: ${external.length} (${external.join(', ')})`)

    const notInNav = mdxFiles(docsDir).filter(slug => !inNav.has(slug))
    report.push(`docs MDX not in the docs nav (live, excluded): ${notInNav.length}${notInNav.length ? ` (${notInNav.join(', ')})` : ''}`)

    // Top-level sections the site header links: Blog (type blog, release posts changelog) and Guides.
    const blogDir = join(content, 'blog')
    const blog = mdxFiles(blogDir).map(name => {
      const file = join(blogDir, `${name}.mdx`)
      const slug = name.replace(/^\d+-/, '')
      const page = sectionPage(
        {
          slug: `blog/${slug}`,
          file,
          path: `vendor/docs/${SOURCE}/${CONTENT}/blog/${name}.mdx`,
          type: 'blog',
          section: 'Blog',
          fallbackTitle: slug,
        },
        siteUrl,
        `${siteUrl}/blog/${slug}`
      )
      if (page.releaseType === 'release') {
        page.type = 'changelog'
        page.section = 'Changelog'
      }
      return page
    })
    blog.sort((a, b) => (b.publishedAt > a.publishedAt ? 1 : b.publishedAt < a.publishedAt ? -1 : a.slug < b.slug ? -1 : 1))

    const guideCollections = readJson(join(content, 'guides.json'))
    const guideDir = join(content, 'guides')
    const guides = mdxFiles(guideDir).map(name => {
      const file = join(guideDir, `${name}.mdx`)
      const page = sectionPage(
        {
          slug: `guides/${name}`,
          file,
          path: `vendor/docs/${SOURCE}/${CONTENT}/guides/${name}.mdx`,
          type: 'guide',
          section: 'Guides',
          fallbackTitle: name,
        },
        siteUrl,
        `${siteUrl}/guides/${name}`
      )
      const collection = guideCollections.find(c => c.id === page.collection)
      page.section = collection ? `Guides / ${collection.title}` : 'Guides'
      page.order = guideCollections.findIndex(c => c.id === page.collection)
      return page
    })
    guides.sort((a, b) => (a.order - b.order) || (a.slug < b.slug ? -1 : 1))

    report.push(`blog: ${blog.length} posts (${blog.filter(p => p.type === 'changelog').length} release posts as changelog); guides: ${guides.length}`)
    const shippedCount = mdxFiles(join(content, 'shipped')).length
    report.push(`excluded, not docs: Spotlight (/shipped, ${shippedCount} customer testimonials); Showcase (listing of external projects, no pages); packages/codemod/docs (repo migration docs, not site pages)`)

    // Props tables from llms-full.txt, validated per page against its PropTable tags.
    const llmsPath = join(root, 'llms', 'llms-full.txt')
    const llmsLines = existsSync(llmsPath) ? readFileSync(llmsPath, 'utf8').split('\n') : []
    const blocks = llmsBlocks(llmsLines, new Set(docs.map(page => page.title)))
    const fallbacks = []
    let tablesFromLlms = 0
    let pagesWithProps = 0
    for (const page of docs) {
      page.propCount = countBlockTags(page.text, 'PropTable')
      if (page.propCount === 0) continue
      pagesWithProps++
      const found = propTablesFor(page, blocks)
      if (found.slots) {
        propTables.set(page.file, found.slots)
        tablesFromLlms += found.slots.filter(slot => typeof slot === 'string').length
      } else {
        fallbacks.push(`${page.slug} (${found.reason})`)
      }
    }
    report.push(
      `props tables: ${pagesWithProps - fallbacks.length}/${pagesWithProps} pages from llms-full.txt (${tablesFromLlms} tables); fallback to notes: ${fallbacks.length}${fallbacks.length ? ` (${fallbacks.join('; ')})` : ''}`
    )

    const pages = [...docs, ...blog, ...guides].map(({ body, propCount, publishedAt, collection, releaseType, order, ...page }) => page)
    return { root, siteUrl, pages, report }
  },
}
