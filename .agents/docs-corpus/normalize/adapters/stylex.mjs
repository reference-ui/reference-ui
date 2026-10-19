/**
 * StyleX adapter. The page list, titles, sections and order come from the docs
 * nav: each folder's meta.json (Fumadocs, under packages/docs/content/docs) lists
 * its pages in order, and a folder without one lists its index first, then its
 * entries by name. The root index is not in the nav but is the live /docs
 * landing, so it leads. Blog posts are not linked from the docs nav, so they are
 * reported and excluded. The live site serves no sitemap.xml or llms.txt, so
 * llms-full.txt is cross-checked by URL.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { parseFrontmatter } from '../lib/frontmatter.mjs'

const SOURCE = 'stylex'
/** The live origin. No file in the clone names it, so it is set here and checked against the site. */
const SITE_URL = 'https://stylexjs.com'
const DOCS = 'packages/docs/content/docs'
const BLOG = 'packages/docs/content/blog'
const LLM_DIR = 'packages/docs/static/llm'
const ROOT_SECTION = 'Docs'
const CALLOUT_KIND = { info: 'Note', tip: 'Note', warning: 'Warning', danger: 'Caution' }
/** Fumadocs `:::name` admonitions and the Callout type each one maps to. */
const DIRECTIVE_TYPE = { note: 'info', info: 'info', tip: 'tip', warning: 'warning', danger: 'danger', caution: 'danger' }
const FENCE = /^\s*(`{3,}|~{3,})/

const isDir = path => existsSync(path) && statSync(path).isDirectory()
const lookup = (table, key, fallback) => (Object.hasOwn(table, key) ? table[key] : fallback)

/** Applies fn to each line outside fenced code; fenced lines pass through unchanged. */
function mapOutsideFences(text, fn) {
  let fence = null
  return text
    .split('\n')
    .map(line => {
      const open = line.match(FENCE)
      if (fence) {
        if (open && open[1][0] === fence[0] && open[1].length >= fence.length && line.trim() === open[1]) fence = null
        return line
      }
      if (open) {
        fence = open[1]
        return line
      }
      return fn(line)
    })
    .join('\n')
}

/** Every string literal in a JSX expression such as ``[`a`, 'b']``, in order. */
function stringsIn(expression) {
  return [...String(expression ?? '').matchAll(/`([^`]*)`|'([^']*)'|"([^"]*)"/g)].map(m => m[1] ?? m[2] ?? m[3])
}

/** Demotes ATX headings by `levels` (capped at H6) so an inlined file nests under its page section. */
function demoteHeadings(text, levels) {
  return mapOutsideFences(text, line => {
    const heading = line.match(/^(#{1,6})(\s.*)$/)
    return heading ? `${'#'.repeat(Math.min(6, heading[1].length + levels))}${heading[2]}` : line
  })
}

/** Fumadocs `:::note` blocks become <Callout> tags, which the Callout hook renders. */
function directivesToCallouts(body, rel) {
  let open = false
  let leftover = 0
  const out = mapOutsideFences(body, line => {
    const start = line.match(/^:::(\w+)\s*$/)
    if (start && !open && Object.hasOwn(DIRECTIVE_TYPE, start[1])) {
      open = true
      return `<Callout type="${DIRECTIVE_TYPE[start[1]]}">`
    }
    if (open && line.trim() === ':::') {
      open = false
      return '</Callout>'
    }
    if (/^:::/.test(line)) leftover++
    return line
  })
  if (open || leftover) throw new Error(`stylex: ${rel} has a ::: directive this adapter does not convert`)
  return out
}

/** A Callout as a blockquote: the kind label, then the title when it adds to the kind. */
function calloutMarkdown(kind, title, children) {
  const body = children.replace(/^\n+|\n+$/g, '')
  const quoted = line => (line.trim() ? `> ${line}` : '>')
  if (title && title.toLowerCase() !== kind.toLowerCase()) {
    const head = `> **${kind}: ${title}**`
    return body ? [head, '>', ...body.split('\n').map(quoted)].join('\n') : head
  }
  const lines = body.split('\n')
  const first = lines.find(line => line.trim() !== '')
  const plain = first !== undefined && !/^(```|[-*]\s|#|\||>|<)/.test(first.trim())
  if (plain && lines[0] === first) return [`> **${kind}:** ${first}`, ...lines.slice(1).map(quoted)].join('\n')
  return body ? [`> **${kind}:**`, '>', ...lines.map(quoted)].join('\n') : `> **${kind}:**`
}

/** The four package-manager commands the site renders for a list of packages. */
function installLines(names, kind) {
  if (!names.length) return []
  const list = names.join(' ')
  return kind === 'dev'
    ? [`npm install --save-dev ${list}`, `pnpm add -D ${list}`, `yarn add -D ${list}`, `bun add -D ${list}`]
    : [`npm install --save ${list}`, `pnpm add ${list}`, `yarn add ${list}`, `bun add ${list}`]
}

/** The site inlines one static guide per component; the clone holds the same file, so the hook inlines it too. */
function llmFileHook(name) {
  return (props, children, ctx) => {
    const text = ctx.readImport(join(ctx.root, LLM_DIR, name))
    if (text === null) return null
    return [`> File: \`${name}\``, '', demoteHeadings(text.trim(), 2)].join('\n')
  }
}

/**
 * Hooks for the site's JSX. Tabs, cards and details are unwrapped; the rest are
 * one-line notes or the text the site renders from props.
 */
export const components = {
  Callout(props, children) {
    const type = typeof props.type === 'string' ? props.type.toLowerCase() : 'info'
    const title = typeof props.title === 'string' ? props.title.trim() : ''
    return calloutMarkdown(lookup(CALLOUT_KIND, type, 'Note'), title, children)
  },
  Tabs(props, children) {
    return children
  },
  TabItem(props, children) {
    const label = [props.label, props.value].find(value => typeof value === 'string') ?? 'Tab'
    return children ? `**${label}**\n\n${children}` : `**${label}**`
  },
  Cards(props, children) {
    return children
  },
  Card(props, children, ctx) {
    const title = typeof props.title === 'string' ? props.title : ''
    const href = typeof props.href === 'string' ? props.href : ''
    const link = href.startsWith('/') ? `${ctx.siteUrl}${href}` : href
    const head = link ? `[${title}](${link})` : `**${title}**`
    const items = [...String(props.description ?? '').matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => m[1].trim())
    if (items.length) return [`- ${head}`, ...items.map(item => `  - ${item}`)].join('\n')
    const description = typeof props.description === 'string' ? props.description : children
    return description ? `- ${head}: ${description}` : `- ${head}`
  },
  Details(props, children) {
    return children
  },
  Summary(props, children) {
    return `### ${children}`
  },
  Accordion(props, children) {
    const title = typeof props.title === 'string' ? props.title : 'Details'
    return `### ${title}\n\n${children}`
  },
  DevInstallExample(props) {
    const lines = [...installLines(stringsIn(props.prod), 'prod'), ...installLines(stringsIn(props.dev), 'dev')]
    return lines.length ? ['```sh', ...lines, '```'].join('\n') : null
  },
  AnimatedGradientBox() {
    return '> Demo: an animated gradient box that the site renders live. Its source is not in this clone.'
  },
  LLMInstallationFile: llmFileHook('stylex-installation.md'),
  LLMStylingFile: llmFileHook('stylex-authoring.md'),
}

/** Folder metadata from its meta.json, or null when it has none. */
function readMeta(dirAbs) {
  const file = join(dirAbs, 'meta.json')
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null
}

function titleOf(file) {
  return parseFrontmatter(readFileSync(file, 'utf8')).data.title
}

/** A folder's nav title: its meta title, else its index page's title, else its name. */
function folderTitle(dirAbs, meta, dirRel) {
  if (meta?.title) return meta.title
  const index = join(dirAbs, 'index.mdx')
  if (existsSync(index)) return titleOf(index)
  const name = dirRel.split('/').pop()
  return name.charAt(0).toUpperCase() + name.slice(1)
}

/** Entries from a meta.json `pages` list, as paths under DOCS. Unknown forms fail loudly. */
function metaEntries(dirRel, dirAbs, meta) {
  return meta.pages.map(raw => {
    if (typeof raw !== 'string' || raw === '...' || raw.startsWith('---')) {
      throw new Error(`stylex: ${join(dirAbs, 'meta.json')} has an entry this adapter does not read: ${JSON.stringify(raw)}`)
    }
    return join(dirRel, raw)
  })
}

/** A folder without meta.json: files and folders by name, the index handled by the caller. */
function sortedEntries(dirRel, dirAbs) {
  return readdirSync(dirAbs)
    .filter(name => name !== 'index.mdx' && name !== 'meta.json' && (isDir(join(dirAbs, name)) || /\.mdx$/.test(name)))
    .sort()
    .map(name => join(dirRel, name))
}

/** The nav in order, as { rel, chain }: a page's path under DOCS and the folder titles above it. */
function navPages(docsAbs) {
  const out = []
  const walk = (dirRel, parentChain) => {
    const dirAbs = join(docsAbs, dirRel)
    const meta = readMeta(dirAbs)
    const chain = dirRel ? [...parentChain, folderTitle(dirAbs, meta, dirRel)] : []
    const entries = meta ? metaEntries(dirRel, dirAbs, meta) : sortedEntries(dirRel, dirAbs)
    const index = dirRel ? join(dirRel, 'index.mdx') : null
    if (index && existsSync(join(docsAbs, index)) && !entries.includes(index)) out.push({ rel: index, chain })
    for (const rel of entries) {
      const abs = join(docsAbs, rel)
      if (isDir(abs)) walk(rel, chain)
      else if (existsSync(abs)) out.push({ rel, chain })
      else throw new Error(`stylex: a nav entry names ${rel}, which is not under ${DOCS}`)
    }
  }
  walk('', [])
  return out
}

/** Every .mdx under a directory, as paths relative to it. */
function mdxFiles(dirAbs, dirRel = '', out = []) {
  for (const name of readdirSync(dirAbs).sort()) {
    const abs = join(dirAbs, name)
    if (isDir(abs)) mdxFiles(abs, join(dirRel, name), out)
    else if (/\.mdx$/.test(name)) out.push(join(dirRel, name))
  }
  return out
}

/** Nav group for the Memex section: the folder titles above the page, or the root. */
function sectionOf(chain) {
  return chain.length ? chain.join(' / ') : ROOT_SECTION
}

function typeOf(rel) {
  if (rel === 'index.mdx') return 'other'
  if (rel === 'llm-resources.mdx') return 'ai'
  if (rel === 'ecosystem.mdx' || rel === 'acknowledgements.mdx') return 'other'
  const [top, group] = rel.split('/')
  if (top === 'api') return 'api-reference'
  if (group === 'installation') return 'install'
  if (group === 'theming') return 'theming'
  if (rel === 'learn/index.mdx' || rel === 'learn/thinking-in-stylex.mdx') return 'concept'
  return 'guide'
}

function pageOf(docsAbs, { rel, chain }) {
  const file = join(docsAbs, rel)
  const { data, body } = parseFrontmatter(readFileSync(file, 'utf8'))
  if (typeof data.title !== 'string' || !data.title.trim()) throw new Error(`stylex: ${rel} has no frontmatter title`)
  const slug = rel.replace(/\.mdx$/, '').replace(/\/index$/, '')
  const urlPath = slug === 'index' ? '/docs' : `/docs/${slug}`
  return {
    slug,
    title: data.title,
    description: typeof data.description === 'string' ? data.description : '',
    url: `${SITE_URL}${urlPath}`,
    section: sectionOf(chain),
    type: typeOf(rel),
    path: `vendor/docs/${SOURCE}/${DOCS}/${rel}`,
    file,
    format: 'mdx',
    text: directivesToCallouts(body, rel),
  }
}

export default {
  source: SOURCE,

  async collect({ vendorDir }) {
    const root = join(vendorDir, SOURCE)
    const docsAbs = join(root, DOCS)
    const nav = navPages(docsAbs)
    const rows = new Map()
    for (const row of [{ rel: 'index.mdx', chain: [] }, ...nav]) if (!rows.has(row.rel)) rows.set(row.rel, row)
    const pages = [...rows.values()].map(row => pageOf(docsAbs, row))

    const included = new Set(rows.keys())
    const orphans = mdxFiles(docsAbs).filter(rel => !included.has(rel))
    const blogPosts = readdirSync(join(root, BLOG)).filter(name => /\.mdx?$/.test(name)).length

    const llms = readFileSync(join(root, 'llms', 'llms-full.txt'), 'utf8')
    const llmsPaths = new Set(
      llms.split('\n').map(line => line.match(/^# .+ \((\/docs[^)\s]*)\)$/)?.[1]).filter(Boolean)
    )
    const pagePaths = new Set(pages.map(page => page.url.slice(SITE_URL.length)))
    const notInLlms = pages.filter(page => !llmsPaths.has(page.url.slice(SITE_URL.length))).map(page => page.slug)
    const notInDocs = [...llmsPaths].filter(path => !pagePaths.has(path))

    const report = [
      `nav: ${nav.length} pages from meta.json, plus the root index (the /docs landing, not in the nav)`,
      `blog excluded: ${blogPosts} posts in ${BLOG}, none linked from the docs nav`,
      `llms-full.txt: ${llmsPaths.size} /docs entries; docs not in llms-full (${notInLlms.length}): ${notInLlms.join(', ') || 'none'}; llms-full not in docs (${notInDocs.length}): ${notInDocs.join(', ') || 'none'}`,
      `not in nav (excluded): ${orphans.join(', ') || 'none'}`,
      'static/llm guides: LLMInstallationFile and LLMStylingFile inline stylex-installation.md and stylex-authoring.md',
    ]
    return { root, siteUrl: SITE_URL, pages, report }
  },
}
