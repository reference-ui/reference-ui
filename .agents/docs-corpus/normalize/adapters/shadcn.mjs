/**
 * shadcn/ui adapter. The page list, titles, sections and order come from the docs
 * page tree in the clone (`apps/v4/content/docs`): each folder's `meta.json` lists
 * its pages (`...` takes the rest, `!name` hides one, `[Title](/docs/x)` links one).
 * A page outside that tree is added only when the live site links it from the header
 * or a section index: Directory (header) and every changelog entry (the Changelog
 * index links them all). Everything else under /docs is excluded and reported.
 * Demo source is inlined from `apps/v4/examples`; registry source is not in the clone.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import { parseFrontmatter } from '../lib/frontmatter.mjs'

const SOURCE = 'shadcn'
const SITE = 'https://ui.shadcn.com'
const APP = 'apps/v4'
const DOCS = `${APP}/content/docs`
const EXAMPLES = `${APP}/examples`
const REGISTRY = `${APP}/registry`
const LANG_BY_EXT = { '.tsx': 'tsx', '.ts': 'ts', '.jsx': 'jsx', '.js': 'js', '.mjs': 'js', '.css': 'css', '.json': 'json' }

/** Pages outside the tree that the live header links (see the file comment). */
const HEADER_LINKED = new Set(['directory'])

const TYPE_BY_SLUG = {
  index: 'concept',
  'components/index': 'concept',
  'ai-elements/index': 'ai',
  'registry/index': 'concept',
  'installation/index': 'install',
  'dark-mode/index': 'theming',
  'rtl/index': 'guide',
  'changelog/index': 'changelog',
  'components-json': 'api-reference',
  cli: 'api-reference',
  theming: 'theming',
  skills: 'ai',
  legacy: 'other',
  directory: 'other',
  'registry/mcp': 'ai',
  'registry/faq': 'faq',
  'registry/api-reference': 'api-reference',
  'registry/registry-json': 'api-reference',
  'registry/registry-item-json': 'api-reference',
}
const TYPE_BY_FOLDER = {
  installation: 'install',
  'dark-mode': 'theming',
  components: 'component',
  'ai-elements': 'component',
  react: 'component',
  helpers: 'ai',
  utils: 'api-reference',
  changelog: 'changelog',
}
const FALLBACK_TYPE = 'guide'

const CALLOUT_KIND = { warning: 'Warning', warn: 'Warning', danger: 'Caution', error: 'Caution' }
const DATA_NOTE = 'The site generates this list from data that this clone does not include.'

/** Tab label per MDX file: value -> label, filled by TabsTrigger before its TabsContent. */
const TAB_LABELS = new Map()

const collapse = text => String(text ?? '').replace(/\s+/g, ' ').trim()
const quote = line => (line.trim() ? `> ${line}` : '>')
const str = value => (typeof value === 'string' ? value : '')
const defaultTitle = name => name.charAt(0).toUpperCase() + name.slice(1)

/** Page slug: the docs path under /docs without the route group, e.g. `components/radix/button`. */
const slugOf = rel => rel.replace(/^\(root\)\//, '')

/** The live URL path of a docs file, e.g. `components/index` -> `/docs/components`. */
function urlPathOf(rel) {
  const path = slugOf(rel)
  if (path === 'index') return '/docs'
  return path.endsWith('/index') ? `/docs/${path.slice(0, -'/index'.length)}` : `/docs/${path}`
}

const isFolder = path => existsSync(path) && statSync(path).isDirectory()
const isPage = pathNoExt => existsSync(`${pathNoExt}.mdx`)

function readMeta(dir) {
  const file = join(dir, 'meta.json')
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null
}

/** Folder title: its meta.json title, else its name capitalised. */
function folderTitle(docsDir, rel) {
  return readMeta(join(docsDir, rel))?.title ?? defaultTitle(rel.split('/').pop())
}

/** Page and folder names inside a folder: `index` first, then by name. */
function childNames(dir) {
  const names = new Set()
  for (const entry of readdirSync(dir)) {
    if (entry.endsWith('.mdx')) names.add(entry.slice(0, -'.mdx'.length))
    else if (!entry.startsWith('.') && isFolder(join(dir, entry))) names.add(entry)
  }
  return [...names].sort((a, b) => (a === 'index' ? -1 : b === 'index' ? 1 : a < b ? -1 : a > b ? 1 : 0))
}

/** Every MDX file under the docs folder, as paths relative to it without the extension. */
function allDocsPages(dir, base = dir, out = []) {
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name)
    if (isFolder(full)) allDocsPages(full, base, out)
    else if (name.endsWith('.mdx')) out.push(relative(base, full).replace(/\.mdx$/, ''))
  }
  return out
}

/** The file a nav link such as `/docs/cli` routes to, or null. */
function resolveDocsPath(docsDir, path) {
  if (path === '') return '(root)/index'
  const candidates = [path, `${path}/index`, `(root)/${path}`, `(root)/${path}/index`]
  return candidates.find(candidate => isPage(join(docsDir, candidate))) ?? null
}

/**
 * Walks the page tree from the root meta.json. Returns the nav pages in nav order
 * (first occurrence wins), the section path of each, and what was skipped.
 */
function walkNav(docsDir) {
  const found = []
  const seen = new Set()
  const notes = { nonDocs: [], noContent: [], hidden: new Set() }

  const take = (rel, navTitle, section) => {
    const slug = slugOf(rel)
    if (seen.has(slug)) return
    seen.add(slug)
    found.push({ rel, navTitle, section })
  }

  const visitName = (dirRel, name, parts) => {
    const rel = dirRel ? `${dirRel}/${name}` : name
    const abs = join(docsDir, rel)
    if (isPage(abs)) return take(rel, '', parts.join(' / '))
    if (isFolder(abs)) {
      const own = readMeta(abs)?.title
      // A top-level folder starts a section; a nested one adds its title only when it has one.
      const next = dirRel === '' ? [folderTitle(docsDir, rel)] : own ? [...parts, own] : parts
      return visitFolder(rel, next)
    }
    notes.noContent.push(rel)
  }

  const visitLink = (title, href, parts) => {
    const path = href === '/docs' ? '' : href.startsWith('/docs/') ? href.slice('/docs/'.length) : null
    if (path === null) return notes.nonDocs.push(`${title} (${href})`)
    const rel = resolveDocsPath(docsDir, path)
    if (!rel) return notes.noContent.push(`${title} (${href})`)
    take(rel, title, parts.join(' / '))
  }

  const visitFolder = (relDir, parts) => {
    const abs = join(docsDir, relDir)
    const items = readMeta(abs)?.pages ?? ['...']
    const listed = new Set()
    for (const item of items) {
      if (item === '...' || item.startsWith('---')) continue
      if (item.startsWith('!')) listed.add(item.slice(1))
      else if (!item.startsWith('[')) listed.add(item)
    }
    for (const item of items) {
      if (item === '...') {
        for (const name of childNames(abs)) if (!listed.has(name)) visitName(relDir, name, parts)
      } else if (item.startsWith('---')) {
        continue
      } else if (item.startsWith('!')) {
        notes.hidden.add(relDir ? `${relDir}/${item.slice(1)}` : item.slice(1))
      } else {
        const link = item.match(/^\[(.*)\]\((.*)\)$/)
        if (link) visitLink(link[1], link[2], parts)
        else visitName(relDir, item, parts)
      }
    }
  }

  visitFolder('', [])
  return { found, notes }
}

/** Section of a file outside the tree: its folder titles, the way the tree would name them. */
function sectionOf(docsDir, rel) {
  const folders = rel.split('/').slice(0, -1)
  const parts = []
  let acc = ''
  folders.forEach((name, i) => {
    acc = acc ? `${acc}/${name}` : name
    const own = readMeta(join(docsDir, acc))?.title
    if (i === 0) parts.push(folderTitle(docsDir, acc))
    else if (own) parts.push(own)
  })
  return parts.join(' / ')
}

function typeOf(slug) {
  return TYPE_BY_SLUG[slug] ?? TYPE_BY_FOLDER[slug.split('/')[0]] ?? FALLBACK_TYPE
}

const WRAPPER_TAGS = ['div', 'p', 'span', 'figure', 'figcaption', 'section', 'ul', 'ol']

/** A line that is only an opening tag (not self-closing), e.g. `  <figure className="x">`. */
function isOpenTag(line, tag) {
  return new RegExp(`^\\s*<${tag}(?:\\s[^>]*)?>\\s*$`).test(line) && !/\/>\s*$/.test(line)
}

/** The line that closes `tag` at the same depth, or -1. */
function closingLine(lines, from, tag) {
  const close = new RegExp(`^\\s*</${tag}>\\s*$`)
  let depth = 0
  for (let j = from; j < lines.length; j++) {
    if (close.test(lines[j])) {
      if (depth === 0) return j
      depth--
    } else if (isOpenTag(lines[j], tag)) depth++
  }
  return -1
}

/**
 * Lowercase HTML wrappers that stand alone on their lines (div, figure, ul, ...)
 * are removed, and their content is dedented by the wrapper's own inner indent.
 * Without that, content indented under a removed wrapper reads as a code block.
 */
function unwrapBlocks(lines) {
  const out = lines.slice()
  for (let i = 0; i < out.length; i++) {
    const tag = WRAPPER_TAGS.find(name => isOpenTag(out[i], name))
    if (!tag) continue
    const close = closingLine(out, i + 1, tag)
    if (close === -1) continue
    const inner = out.slice(i + 1, close).filter(line => line.trim())
    const indent = inner.length ? Math.min(...inner.map(line => line.match(/^\s*/)[0].length)) : 0
    for (let k = i + 1; k < close; k++) out[k] = out[k].slice(Math.min(indent, out[k].match(/^\s*/)[0].length))
    out[i] = ''
    out[close] = ''
  }
  return out
}

/** The index of the brace that closes the one at `start`, or -1. */
function matchingBrace(text, start) {
  let depth = 0
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++
    else if (text[i] === '}' && --depth === 0) return i
  }
  return -1
}

/**
 * The site's use-case table is a JSX expression that maps literal rows of
 * `[label, ...files]`. The converter cannot run it, so each row becomes one
 * list item: the same strings, in the order the table shows them.
 */
function rowExpressions(text) {
  let out = ''
  let at = 0
  for (let start = text.indexOf('{['); start !== -1; start = text.indexOf('{[', at)) {
    const end = matchingBrace(text, start)
    if (end === -1) break
    const body = text.slice(start, end + 1)
    out += text.slice(at, start)
    at = end + 1
    if (!body.includes('.map(([label, ...files])')) {
      out += body
      continue
    }
    out = out.replace(/[ \t]+$/, '')
    const rows = [...body.matchAll(/\[\s*((?:"[^"]*"\s*,?\s*)+)\]/g)].map(row => [...row[1].matchAll(/"([^"]*)"/g)].map(s => s[1]))
    out += rows
      .map(([label, ...files]) => `- **${label}:** ${files.map(file => `\`${file}\``).join(', ')}`)
      .join('\n')
  }
  return out + text.slice(at)
}

/** Markup that never reaches a hook: lowercase HTML wrappers, SVG art and inline JSX. */
function cleanRun(chunk) {
  const spans = []
  const masked = chunk.replace(/(`+)[\s\S]*?\1/g, match => `\u0000${spans.push(match) - 1}\u0000`)
  const cleaned = unwrapBlocks(rowExpressions(masked).split('\n'))
    .join('\n')
    .replace(/<svg\b[^>]*\/>/g, '')
    .replace(/<svg\b[\s\S]*?<\/svg>/g, '')
    .replace(/<[A-Z][A-Za-z0-9]*Icon\b[^>]*\/>/g, '')
    .replace(/<Link\b([^>]*?)>([\s\S]*?)<\/Link>/g, (all, attrs, inner) => {
      const href = attrs.match(/\bhref="([^"]*)"/)?.[1]
      if (!href || inner.includes('<') || !collapse(inner)) return all
      return `[${collapse(inner)}](${href})`
    })
    .replace(/<Kbd\b[^>]*>([\s\S]*?)<\/Kbd>/g, (_, inner) => `\`${collapse(inner)}\``)
    .replace(/<strong>([\s\S]*?)<\/strong>/g, (_, inner) => `**${collapse(inner)}**`)
    .replace(/<code>([\s\S]*?)<\/code>/g, (_, inner) => `\`${collapse(inner)}\``)
    .replace(/<li>([\s\S]*?)<\/li>/g, (_, inner) => `- ${collapse(inner)}`)
    .replace(/<\/?(ul|ol)\b[^>]*>/g, '')
    .replace(/<a\s+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g, (all, href, inner) => {
      if (inner.includes('<')) return inner
      return collapse(inner) ? `[${collapse(inner)}](${href})` : ''
    })
    .replace(/<br\s*\/?>/g, ' ')
    .replace(/\{" "\}/g, ' ')
    .replace(/<\/?(div|span|p|figure|figcaption|section)\b[^>]*>/g, '')
  return cleaned.replace(/\u0000(\d+)\u0000/g, (_, i) => spans[Number(i)])
}

const OPEN_FENCE = /^(\s*)(`{3,}|~{3,})(.*)$/
const CLOSE_FENCE = /^\s*(`{3,}|~{3,})\s*$/

/** Applies `fn` to each run of lines outside fenced code, so code stays verbatim. */
function outsideFences(text, fn) {
  const out = []
  let run = []
  let mark = null
  const flush = () => {
    if (run.length) out.push(fn(run.join('\n')))
    run = []
  }
  for (const line of text.split('\n')) {
    if (mark) {
      out.push(line)
      const close = line.match(CLOSE_FENCE)
      if (close && close[1][0] === mark[0] && close[1].length >= mark.length) mark = null
      continue
    }
    const open = line.match(OPEN_FENCE)
    if (open && !(open[2][0] === '`' && open[3].includes('`'))) {
      flush()
      mark = open[2]
      out.push(line)
      continue
    }
    run.push(line)
  }
  flush()
  return out.join('\n')
}

/** The page body with its markup cleaned, ready for the shared MDX converter. */
function cleanBody(body) {
  return outsideFences(body.replace(/\r\n?/g, '\n'), cleanRun)
}

/** A fenced block whose fence is longer than any backtick run in the source. */
function codeBlock(lang, source) {
  const longest = Math.max(0, ...[...source.matchAll(/`+/g)].map(m => m[0].length))
  const fence = '`'.repeat(Math.max(3, longest + 1))
  return [`${fence}${lang}`, ...source.replace(/\n$/, '').split('\n'), fence]
}

/** The demo file for a ComponentPreview: the base's examples, or the registry's examples for new-york styles. */
function demoFile(root, styleName, name) {
  const base = styleName.split('-')[0]
  const candidates = [
    join(root, EXAMPLES, base, `${name}.tsx`),
    join(root, REGISTRY, styleName, 'examples', `${name}.tsx`),
  ]
  return candidates.find(file => existsSync(file)) ?? null
}

/** Root-relative and #-links become live URLs, as the shared converter does for prose. */
function absoluteHref(href, scope) {
  if (href.startsWith('/')) return `${scope.siteUrl}${href}`
  if (href.startsWith('#')) return `${scope.siteUrl}${urlPathOf(relOf(scope.file, scope.root))}${href}`
  return href
}

function relOf(file, root) {
  return relative(join(root, DOCS), file).replace(/\.mdx$/, '')
}

function calloutLines(props, children) {
  const variant = str(props.variant ?? props.type ?? 'info').toLowerCase()
  const kind = CALLOUT_KIND[variant] ?? 'Note'
  const title = collapse(str(props.title))
  const body = children ? children.split('\n') : []
  if (title) {
    const head = kind === 'Note' ? title : `${kind}: ${title}`
    return [`> **${head}**`, ...(body.length ? ['>', ...body.map(quote)] : [])].join('\n')
  }
  const first = body.find(line => line.trim() !== '')
  const plainFirst = first !== undefined && !/^(```|[-*]\s|#|\||>|<)/.test(first.trim())
  // A bold lead-in in the source (`**Note:** ...`) already names the callout; keep it as written.
  const hasLeadIn = kind === 'Note' && first !== undefined && first.trim().startsWith('**')
  if (hasLeadIn && body[0] === first) return [`> ${first}`, ...body.slice(1).map(quote)].join('\n')
  if (plainFirst && body[0] === first) return [`> **${kind}:** ${first}`, ...body.slice(1).map(quote)].join('\n')
  return [`> **${kind}:**`, '>', ...body.map(quote)].join('\n')
}

/**
 * Hooks for the site's JSX. Each receives its children already converted to Markdown.
 * Tabs: each TabsTrigger records its label before the TabsContent that uses it.
 */
export const components = {
  ComponentPreview(props, _children, scope) {
    const name = str(props.name)
    const styleName = str(props.styleName)
    const file = name && styleName ? demoFile(scope.root, styleName, name) : null
    const source = file ? scope.readImport(file) : null
    if (source == null) return null
    return [`Example \`${name}\``, '', ...codeBlock('tsx', source)].join('\n')
  },

  ComponentSource(props, _children, scope) {
    const label = str(props.title) || str(props.src) || str(props.name)
    if (!label) return null
    const file = str(props.src).startsWith('/') ? join(scope.root, APP, props.src) : ''
    const source = file ? scope.readImport(file) : null
    if (source == null) return `Source file: \`${label}\``
    return [`Source file: \`${label}\``, '', ...codeBlock(LANG_BY_EXT[extname(file)] ?? '', source)].join('\n')
  },

  CodeTabs: (_props, children) => children,
  Tabs: (_props, children) => children,
  TabsList: () => '',
  TabsTrigger(props, children, scope) {
    if (!TAB_LABELS.has(scope.file)) TAB_LABELS.set(scope.file, new Map())
    TAB_LABELS.get(scope.file).set(str(props.value), collapse(children))
    return ''
  },
  TabsContent(props, children, scope) {
    const value = str(props.value)
    const label = TAB_LABELS.get(scope.file)?.get(value) || value
    return [...(label ? [`**${label}**`, ''] : []), children].join('\n')
  },

  Step: (_props, children) => children,

  Callout: (props, children) => calloutLines(props, children),

  LinkedCard(props, children, scope) {
    const href = str(props.href) ? absoluteHref(str(props.href), scope) : ''
    if (!href) return null
    const lines = children.split('\n').map(line => line.trim()).filter(Boolean)
    const title = lines[0] ?? href
    const description = lines.slice(1).join(' ')
    return description ? `- [${title}](${href}): ${description}` : `- [${title}](${href})`
  },

  Image(props, _children, scope) {
    if (typeof props.src !== 'string') return null
    return `![${str(props.alt)}](${absoluteHref(props.src, scope)})`
  },

  Accordion: (_props, children) => children,
  AccordionItem: (_props, children) => children,
  AccordionTrigger: (_props, children) => (collapse(children) ? `### ${collapse(children)}` : ''),
  AccordionContent: (_props, children) => children,

  Button: (_props, children) => children,
  CodeCollapsibleWrapper: (_props, children) => children,

  ComponentsList(props) {
    const what = props.variant === 'new' ? 'the components marked new' : 'every component'
    return `> List: ${what}. ${DATA_NOTE}`
  },
  DirectoryList: () => `> List: the community registries in the directory. ${DATA_NOTE}`,
}

function dateOf(file) {
  return str(parseFrontmatter(readFileSync(file, 'utf8')).data.date)
}

function pageOf(docsDir, root, rel, navTitle, section) {
  const file = join(docsDir, `${rel}.mdx`)
  const { data, body } = parseFrontmatter(readFileSync(file, 'utf8'))
  const slug = slugOf(rel)
  return {
    slug,
    title: data.title || navTitle,
    description: data.description ?? '',
    url: `${SITE}${urlPathOf(rel)}`,
    section,
    type: typeOf(slug),
    path: `vendor/docs/${SOURCE}/${DOCS}/${rel}.mdx`,
    file,
    format: 'mdx',
    text: cleanBody(body),
  }
}

/** Live URL paths named in llms.txt, so the report can compare them with the output. */
function llmsPaths(root) {
  const file = join(root, 'llms', 'llms.txt')
  if (!existsSync(file)) return []
  const paths = [...readFileSync(file, 'utf8').matchAll(/https:\/\/ui\.shadcn\.com(\/docs[^\s)]*)/g)].map(m => m[1])
  return [...new Set(paths.map(path => path.replace(/\/$/, '')))]
}

export default {
  source: SOURCE,

  async collect({ vendorDir, entry }) {
    const root = join(vendorDir, SOURCE)
    const docsDir = join(root, DOCS)
    const { found, notes } = walkNav(docsDir)
    const inTree = new Set(found.map(item => slugOf(item.rel)))

    // Pages outside the tree, by the live index that links them (first match wins):
    // llms.txt (the site's index of its sections), the header, then the Changelog index.
    const outside = allDocsPages(docsDir).filter(rel => !inTree.has(slugOf(rel)))
    const llms = llmsPaths(root)
    const byLlms = llms.map(path => outside.find(rel => urlPathOf(rel) === path)).filter(Boolean)
    const taken = new Set(byLlms)
    const byHeader = outside.filter(rel => !taken.has(rel) && HEADER_LINKED.has(slugOf(rel)))
    for (const rel of byHeader) taken.add(rel)
    const changelog = outside
      .filter(rel => !taken.has(rel) && rel.startsWith('changelog/'))
      .sort((a, b) => {
        const byDate = dateOf(join(docsDir, `${b}.mdx`)).localeCompare(dateOf(join(docsDir, `${a}.mdx`)))
        return byDate || (slugOf(a) < slugOf(b) ? -1 : 1)
      })
    for (const rel of changelog) taken.add(rel)
    const excluded = outside
      .filter(rel => !taken.has(rel))
      .map(rel => `${slugOf(rel)} (${notes.hidden.has(rel) ? 'hidden: ! in meta.json' : 'not in the nav tree; no live index links it'})`)

    const pages = [
      ...found.map(item => pageOf(docsDir, root, item.rel, item.navTitle, item.section)),
      ...[...byLlms, ...byHeader, ...changelog].map(rel => pageOf(docsDir, root, rel, '', sectionOf(docsDir, rel))),
    ]

    const ours = new Set(pages.map(page => page.url.slice(SITE.length)))
    const llmsMissing = llms.filter(path => !ours.has(path))
    const report = [
      `nav: ${found.length} pages from the docs page tree (meta.json); nav links outside /docs skipped: ${notes.nonDocs.join(' | ') || 'none'}`,
      `nav without content: ${notes.noContent.join(' | ') || 'none'}`,
      `outside the tree, linked by llms.txt (${byLlms.length}): ${byLlms.map(slugOf).join(', ') || 'none'}`,
      `outside the tree, linked from the header (${byHeader.length}): ${byHeader.map(slugOf).join(', ') || 'none'}`,
      `outside the tree, Changelog index (${changelog.length} entries, date order)`,
      `excluded from /docs (${excluded.length}): ${excluded.join(' | ') || 'none'}`,
      `llms.txt URLs with no page here (${llmsMissing.length}): ${llmsMissing.join(' ') || 'none'}`,
    ]

    return { root, siteUrl: SITE, pages, report }
  },
}
