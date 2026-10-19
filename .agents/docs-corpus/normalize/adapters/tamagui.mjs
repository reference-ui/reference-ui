/**
 * Tamagui adapter. The page list, its order and its sections come from the docs
 * nav (`code/tamagui.dev/features/docs/docsRoutes.tsx`, sections `core` and `ui`).
 * A `/docs/...` route is one MDX file under `data/docs/`. A `/ui/<name>` route is
 * the folder `data/docs/components/<name>/`, and the live page shows its highest
 * semver version file; the older versions are not live pages. The live URLs
 * `/tailwind/`, `/unstyled/`, `/tailwind-ui/` and `/styled-ui/` render the same MDX
 * with other chrome and code syntax, so they are not pages of their own.
 * Live pages the nav does not list come from UNLISTED, after the nav pages, in
 * section "Unlisted". Other MDX outside the nav is left out (see the report lines).
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { stripTypeScriptTypes } from 'node:module'
import { parseFrontmatter } from '../lib/frontmatter.mjs'
import { jsxToMarkdown, mdTable, parseLiteral } from './tamagui/literal.mjs'
import { prepareBody } from './tamagui/prepare.mjs'

const SOURCE = 'tamagui'
const SITE = 'https://tamagui.dev'
const DOCS_DIR = 'code/tamagui.dev/data/docs'
const BLOG_DIR = 'code/tamagui.dev/data/blog'
const NAV_FILE = 'code/tamagui.dev/features/docs/docsRoutes.tsx'
const DEMO_INDEX = 'code/tamagui.dev/features/docs/demos.tsx'
const DEMO_DIR = 'code/demos/src'
const SECTION_TITLE = { core: 'Core', ui: 'Components' }

/** Page type for each /docs route in the nav. Every docs route must be listed here. */
const TYPE_BY_ROUTE = {
  '/docs/intro/introduction': 'concept',
  '/docs/intro/installation': 'install',
  '/docs/intro/components': 'concept',
  '/docs/intro/styles': 'concept',
  '/docs/intro/design-system': 'concept',
  '/docs/core/tailwind': 'guide',
  '/docs/core/native': 'guide',
  '/docs/core/cli': 'api-reference',
  '/docs/core/configuration': 'api-reference',
  '/docs/core/tamagui-provider': 'api-reference',
  '/docs/core/tokens': 'theming',
  '/docs/core/fonts': 'theming',
  '/docs/intro/themes': 'theming',
  '/docs/core/theme': 'api-reference',
  '/docs/core/shorthands': 'api-reference',
  '/docs/core/settings': 'api-reference',
  '/docs/core/sizing': 'theming',
  '/docs/core/config-v6': 'api-reference',
  '/docs/core/config-v6-colors': 'theming',
  '/docs/core/surfaces': 'theming',
  '/docs/core/style-props': 'api-reference',
  '/docs/core/styled': 'api-reference',
  '/docs/core/variants': 'api-reference',
  '/docs/core/style-pieces': 'api-reference',
  '/docs/core/create-styled-context': 'api-reference',
  '/docs/core/view-and-text': 'api-reference',
  '/docs/core/html-primitives': 'api-reference',
  '/docs/core/exports': 'api-reference',
  '/docs/core/use-media': 'api-reference',
  '/docs/core/use-theme': 'api-reference',
  '/docs/core/animations': 'concept',
  '/docs/core/animate-presence': 'api-reference',
  '/docs/core/animation-drivers': 'api-reference',
  '/docs/intro/compiler-install': 'install',
  '/docs/core/compiler-tiers': 'concept',
  '/docs/guides/zero-runtime': 'guide',
  '/docs/intro/benchmarks': 'other',
  '/docs/guides/next-js': 'install',
  '/docs/guides/expo': 'install',
  '/docs/guides/vite': 'install',
  '/docs/guides/one': 'install',
  '/docs/guides/webpack': 'install',
  '/docs/guides/metro': 'install',
  '/docs/guides/how-to-upgrade': 'migration',
  '/docs/guides/flat-values': 'guide',
  '/docs/guides/design-systems': 'guide',
  '/docs/guides/theme-builder': 'guide',
  '/docs/guides/how-to-build-a-button': 'guide',
  '/docs/guides/developing': 'guide',
  '/docs/guides/create-tamagui-app': 'install',
  '/docs/core/server-rendering': 'guide',
}

const UI_TYPE = { '/ui/intro': 'install', '/ui/native': 'guide', '/ui/z-index': 'guide' }

/**
 * Live pages the nav does not list (the sitemap has them, the clone has their MDX).
 * The owner ruled them in: they follow the nav pages in section "Unlisted". Each
 * type is set from the page's content. The title is the page's own frontmatter
 * title, because the nav has no entry for these pages.
 */
const UNLISTED_SECTION = 'Unlisted'
const UNLISTED = [
  { route: '/docs/core/animations-css', type: 'api-reference' },
  { route: '/docs/core/animations-motion', type: 'api-reference' },
  { route: '/docs/core/animations-react-native', type: 'api-reference' },
  { route: '/docs/core/animations-reanimated', type: 'api-reference' },
  { route: '/docs/core/config-v5', type: 'migration' },
  { route: '/docs/intro/colors', type: 'theming' },
  { route: '/docs/intro/errors', type: 'faq' },
  { route: '/docs/intro/static', type: 'concept' },
  { route: '/docs/intro/tokens', type: 'theming' },
  { route: '/ui/new-inputs', type: 'component' },
  { route: '/ui/tamagui-image', type: 'component' },
  { route: '/ui/unspaced', type: 'component' },
]

/** Attribute expressions moved out of the MDX by prepare.mjs: page file -> (placeholder -> source). */
const stashes = new Map()
/** <MDXTabs>/<InlineTabs> labels per source file: value -> label text. */
const tabLabelCache = new Map()

const SEMVER = /^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/
const TAB_LABEL = /<(?:MDXTabs|InlineTabs)\.Tab\s+value="([^"]+)"[^>]*>([^<]*)<\/(?:MDXTabs|InlineTabs)\.Tab>/g
const DEMO_LINK = /export const (\w+) = lazyDemo\(\(\) =>\s*import\('@tamagui\/demos\/demo\/(\w+)'\)/g
const COLUMN_ORDER = ['name', 'type', 'required', 'default', 'value', 'example', 'description']
const COLUMN_LABEL = {
  name: 'Name',
  type: 'Type',
  required: 'Required',
  default: 'Default',
  value: 'Value',
  example: 'Example',
  description: 'Description',
}
const CODE_COLUMNS = new Set(['name', 'type', 'default', 'value', 'example'])

/** Nav module, with its TypeScript types stripped; the file has no imports. */
async function loadNav(file) {
  const js = stripTypeScriptTypes(readFileSync(file, 'utf8'))
  return import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)
}

/** Demo name -> file name under DEMO_DIR, from the site's demo registry. */
function demoFilesOf(text) {
  const map = new Map()
  for (const m of text.matchAll(DEMO_LINK)) map.set(m[1], m[2])
  return map
}

/** Negative when `b` is older than `a`, zero for the same version; a release beats its prereleases. */
function compareVersions(a, b) {
  const pa = SEMVER.exec(a)
  const pb = SEMVER.exec(b)
  if (!pa || !pb) throw new Error(`not a semver version: ${a} or ${b}`)
  for (let i = 1; i <= 3; i++) if (pa[i] !== pb[i]) return Number(pa[i]) - Number(pb[i])
  if (pa[4] === pb[4]) return 0
  if (pa[4] === undefined) return 1
  if (pb[4] === undefined) return -1
  return pa[4] < pb[4] ? -1 : 1
}

function versionFiles(dir) {
  return readdirSync(dir).filter(name => name.endsWith('.mdx'))
}

function bestVersionFile(dir) {
  const files = versionFiles(dir)
  if (!files.length) throw new Error(`no version files in ${dir}`)
  return files.reduce((best, name) =>
    compareVersions(name.slice(0, -4), best.slice(0, -4)) > 0 ? name : best
  )
}

/** The MDX file a nav route renders, or a throw when the nav and the clone disagree. */
function fileOfRoute(route, docs) {
  if (route.startsWith('/docs/')) {
    const file = join(docs, `${route.slice('/docs/'.length)}.mdx`)
    if (!existsSync(file)) throw new Error(`nav route ${route} has no MDX file`)
    return file
  }
  if (route.startsWith('/ui/')) {
    const dir = join(docs, 'components', route.slice('/ui/'.length))
    if (!existsSync(dir)) throw new Error(`nav route ${route} has no component folder`)
    return join(dir, bestVersionFile(dir))
  }
  throw new Error(`nav route ${route} is neither /docs nor /ui`)
}

function sectionOf(group) {
  const top = SECTION_TITLE[group.section] ?? group.section
  const name = group.title ?? group.label
  return name ? `${top} / ${name}` : top
}

function typeOf(route, section) {
  if (section === 'ui') return UI_TYPE[route] ?? 'component'
  if (!Object.hasOwn(TYPE_BY_ROUTE, route)) throw new Error(`no page type for nav route ${route}`)
  return TYPE_BY_ROUTE[route]
}

/** Every file under `dir`, in sorted order. */
function allFiles(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) allFiles(full, out)
    else out.push(full)
  }
  return out
}

/** Section slugs in llms-full.txt: a `## <slug>` line whose next non-empty line is `---`. */
function llmsSlugs(text) {
  const lines = text.split('\n')
  const slugs = new Set()
  lines.forEach((line, i) => {
    const m = line.match(/^## (\S+)$/)
    if (!m) return
    const next = lines.slice(i + 1).find(l => l.trim() !== '')
    if (next === '---') slugs.add(m[1])
  })
  return slugs
}

/** Text of a scalar attribute: its plain value, or the stashed literal read back. */
function scalarOf(ctx, value) {
  const v = literalOf(ctx, value)
  return v === undefined || v === null ? '' : String(v)
}

/** The attribute's value: a stashed JS literal parsed, or the plain attribute value. */
function literalOf(ctx, value) {
  if (typeof value === 'string' && value.startsWith('TAMAGUI_EXPR_')) {
    const stash = stashes.get(ctx.file)
    if (!stash?.has(value)) throw new Error(`unknown attribute expression ${value} in ${ctx.file}`)
    return parseLiteral(stash.get(value))
  }
  return value
}

function arrayOf(ctx, value, what) {
  const v = literalOf(ctx, value)
  if (!Array.isArray(v)) throw new Error(`${what} in ${ctx.file} is not an array`)
  return v
}

function absoluteHref(href, siteUrl) {
  return href.startsWith('/') && siteUrl ? `${siteUrl}${href}` : href
}

/** One list or table cell from a literal item: JSX fragments become Markdown. */
function textOf(item, ctx) {
  if (item && typeof item === 'object') {
    if ('jsx' in item) return jsxToMarkdown(item.jsx, ctx.siteUrl)
    throw new Error(`unsupported value ${JSON.stringify(item)} in ${ctx.file}`)
  }
  return String(item ?? '')
}

function codeSpan(text) {
  return text.includes('`') ? text : `\`${text}\``
}

function columnCell(key, value, ctx) {
  if (value === undefined || value === null) return ''
  const text = textOf(value, ctx)
  return CODE_COLUMNS.has(key) && text !== '' ? codeSpan(text) : text
}

/** A GFM callout, as the converter writes its own: the first plain line sits on the kind's line. */
function calloutLines(kind, children) {
  const body = children.replace(/^\n+|\n+$/g, '').split('\n')
  const first = body.find(line => line.trim() !== '')
  if (first === undefined) return [`> **${kind}:**`]
  const plainFirst = !/^(```|[-*]\s|#|\||>|<)/.test(first.trim())
  if (plainFirst && body[0] === first) {
    return [`> **${kind}:** ${first}`, ...body.slice(1).map(line => (line.trim() ? `> ${line}` : '>'))]
  }
  return [`> **${kind}:**`, '>', ...body.map(line => (line.trim() ? `> ${line}` : '>'))]
}

const NOTICE_KIND = { red: 'Caution', yellow: 'Warning' }

function noticeHook(props, children) {
  const kind = NOTICE_KIND[String(props.theme ?? '')] ?? 'Note'
  return calloutLines(kind, children).join('\n')
}

function listHook(prop) {
  return (props, _children, ctx) => {
    const items = arrayOf(ctx, props[prop], `${prop} list`)
    return items
      .map(item => textOf(item, ctx))
      .filter(text => text !== '')
      .map(text => `- ${text}`)
      .join('\n')
  }
}

function propsTableHook(props, _children, ctx) {
  const rows = arrayOf(ctx, props.data, 'PropsTable data')
  const keys = COLUMN_ORDER.filter(key => rows.some(row => key in row))
  for (const row of rows) for (const key of Object.keys(row)) if (!keys.includes(key)) keys.push(key)
  const headers = keys.map(key => COLUMN_LABEL[key] ?? key)
  const body = rows.map(row => keys.map(key => columnCell(key, row[key], ctx)))
  const title = scalarOf(ctx, props.title)
  const lead = title ? [`**${title}**`, ''] : []
  return [...lead, ...mdTable(headers, body)].join('\n')
}

function simpleTableHook(props, _children, ctx) {
  const headers = arrayOf(ctx, props.headers, 'SimpleTable headers').map(h => textOf(h, ctx))
  const rows = arrayOf(ctx, props.rows, 'SimpleTable rows').map(row => {
    if (!Array.isArray(row)) throw new Error(`SimpleTable row is not an array in ${ctx.file}`)
    return row.map(cell => textOf(cell, ctx))
  })
  return mdTable(headers, rows).join('\n')
}

function logoCardHook(props, _children, ctx) {
  const title = scalarOf(ctx, props.title)
  const subtitle = scalarOf(ctx, props.subtitle)
  const link = absoluteHref(scalarOf(ctx, props.link), ctx.siteUrl)
  const head = link ? `[${title}](${link})` : `**${title}**`
  return subtitle ? `- ${head}: ${subtitle}` : `- ${head}`
}

function linkHook(props, children, ctx) {
  const href = absoluteHref(scalarOf(ctx, props.href), ctx.siteUrl)
  return href ? `[${children}](${href})` : children
}

function codeHook(_props, children) {
  return children ? codeSpan(children) : ''
}

/** Tab labels for a source file, read from its own <MDXTabs.Tab>/<InlineTabs.Tab> elements. */
function tabLabels(file) {
  if (!tabLabelCache.has(file)) {
    const labels = new Map()
    for (const m of readFileSync(file, 'utf8').matchAll(TAB_LABEL)) {
      if (!labels.has(m[1])) labels.set(m[1], m[2].trim())
    }
    tabLabelCache.set(file, labels)
  }
  return tabLabelCache.get(file)
}

function tabContentHook(props, children, ctx) {
  const value = scalarOf(ctx, props.value)
  const label = tabLabels(ctx.file).get(value) ?? value
  return [`**${label}**`, '', children].join('\n')
}

function fenceFor(lines) {
  let longest = 0
  for (const line of lines) {
    const m = /^\s*(`+)/.exec(line)
    if (m) longest = Math.max(longest, m[1].length)
  }
  return '`'.repeat(Math.max(3, longest + 1))
}

/** A demo registered by name: its source file in the clone, fenced; null leaves the marker when it is missing. */
function demoHook(file) {
  return (_props, _children, ctx) => {
    const source = ctx.readImport(join(ctx.root, DEMO_DIR, file))
    if (source === null) return null
    const body = source.replace(/\n+$/, '').split('\n')
    const fence = fenceFor(body)
    return [`${fence}tsx`, ...body, fence].join('\n')
  }
}

function widgetNote(name) {
  return () => `> ${name}: a site widget. Its content is not in the clone.`
}

const blank = () => ''
const wrapper = (_props, children) => children

/**
 * Hooks for the site's custom JSX. Demo names are added in collect(), from the
 * site's demo registry, so every demo a page renders is inlined from the clone.
 */
export const components = {
  IntroParagraph: wrapper,
  HeroContainer: wrapper,
  Grid: wrapper,
  Wide: wrapper,
  ClientOnly: wrapper,
  Theme: wrapper,
  Preview: wrapper,
  YStack: wrapper,
  XStack: wrapper,
  View: wrapper,
  Spacer: blank,
  CopyAgentSetupButton: blank,
  DemoButton: blank,
  GetStarted: widgetNote('GetStarted'),
  DocsIntro: widgetNote('DocsIntro'),
  TamaguiExamplesCode: widgetNote('TamaguiExamplesCode'),
  Notice: noticeHook,
  Highlights: listHook('features'),
  Features: listHook('items'),
  PropsTable: propsTableHook,
  SimpleTable: simpleTableHook,
  LogoCard: logoCardHook,
  Link: linkHook,
  Code: codeHook,
  MDXTabs: wrapper,
  'MDXTabs.List': blank,
  'MDXTabs.Tab': blank,
  'MDXTabs.Content': tabContentHook,
  InlineTabs: wrapper,
  'InlineTabs.List': blank,
  'InlineTabs.Tab': blank,
  'InlineTabs.Content': tabContentHook,
}

export default {
  source: SOURCE,

  async collect({ vendorDir, entry }) {
    const root = join(vendorDir, SOURCE)
    const docs = join(root, DOCS_DIR)
    const nav = await loadNav(join(root, NAV_FILE))
    for (const [name, file] of demoFilesOf(readFileSync(join(root, DEMO_INDEX), 'utf8'))) {
      if (!Object.hasOwn(components, name)) components[name] = demoHook(file)
    }

    const report = []
    const pages = []
    const chosen = new Set()
    const navFolders = new Set()
    const seen = new Set()
    const counts = { anchors: 0, external: 0, core: 0, ui: 0, unlistedCore: 0, unlistedUi: 0 }
    let placeholders = 0

    for (const group of nav.docsRoutes) {
      for (const item of group.pages ?? []) {
        const route = item.route
        if (/^https?:/.test(route)) {
          counts.external++
          continue
        }
        if (route.includes('#')) {
          counts.anchors++
          continue
        }
        if (seen.has(route)) continue
        seen.add(route)
        const file = fileOfRoute(route, docs)
        chosen.add(file)
        if (route.startsWith('/ui/')) {
          counts.ui++
          navFolders.add(route.slice('/ui/'.length))
        } else {
          counts.core++
        }
        const { data, body } = parseFrontmatter(readFileSync(file, 'utf8'))
        const prepared = prepareBody(body)
        stashes.set(file, prepared.stash)
        placeholders += prepared.dropped
        pages.push({
          slug: route.slice(1),
          title: item.title,
          description: data.description ?? '',
          url: `${SITE}${route}`,
          section: sectionOf(group),
          type: typeOf(route, group.section),
          path: `vendor/docs/${SOURCE}/${relative(root, file)}`,
          file,
          format: 'mdx',
          text: prepared.text,
        })
      }
    }

    const navPages = pages.length

    for (const { route, type } of UNLISTED) {
      if (seen.has(route)) throw new Error(`${route} is in the nav; drop it from UNLISTED`)
      seen.add(route)
      const file = fileOfRoute(route, docs)
      chosen.add(file)
      if (route.startsWith('/ui/')) counts.unlistedUi++
      else counts.unlistedCore++
      const { data, body } = parseFrontmatter(readFileSync(file, 'utf8'))
      if (!data.title) throw new Error(`${route} has no title in its frontmatter`)
      const prepared = prepareBody(body)
      stashes.set(file, prepared.stash)
      placeholders += prepared.dropped
      pages.push({
        slug: route.slice(1),
        title: data.title,
        description: data.description ?? '',
        url: `${SITE}${route}`,
        section: UNLISTED_SECTION,
        type,
        path: `vendor/docs/${SOURCE}/${relative(root, file)}`,
        file,
        format: 'mdx',
        text: prepared.text,
      })
    }

    report.push(
      `nav: ${navPages} pages (${counts.core} core, ${counts.ui} ui); ` +
        `${counts.anchors} section anchors on /docs/core/exports and ${counts.external} external link skipped`
    )

    report.push(
      `empty hero placeholders dropped: ${placeholders} (the site fills each from the demo, which is inlined)`
    )

    const mdx = allFiles(docs).filter(f => f.endsWith('.mdx'))
    const componentDir = join(docs, 'components')
    const componentFiles = mdx.filter(f => f.startsWith(componentDir + '/'))
    const folderOf = f => relative(componentDir, f).split('/')[0]
    const unlistedFolders = UNLISTED.filter(e => e.route.startsWith('/ui/')).map(e => e.route.slice('/ui/'.length))
    const convertedFolders = new Set([...navFolders, ...unlistedFolders])
    const superseded = componentFiles.filter(f => !chosen.has(f) && convertedFolders.has(folderOf(f)))
    const outsideFolders = [...new Set(componentFiles.map(folderOf))].filter(folder => !convertedFolders.has(folder))
    report.push(
      `components: ${counts.ui + counts.unlistedUi} pages use the highest-semver version of their folder; ` +
        `${superseded.length} older versions are not live pages and are not converted; ` +
        `folders outside the nav and the unlisted list, not converted: ${outsideFolders.join(', ') || 'none'}`
    )

    report.push(
      `unlisted: ${counts.unlistedCore + counts.unlistedUi} live pages the nav does not list, in section "${UNLISTED_SECTION}" ` +
        `after the nav pages (${counts.unlistedCore} core, ${counts.unlistedUi} ui); ` +
        'titles from their own frontmatter; types set by content'
    )

    const orphans = mdx
      .filter(f => !f.startsWith(componentDir + '/') && !chosen.has(f))
      .map(f => relative(docs, f).replace(/\.mdx$/, ''))
    report.push(
      `docs MDX outside the nav and the unlisted list, not converted (${orphans.length}): ${orphans.join(', ') || 'none'}`
    )

    const blogPosts = allFiles(join(root, BLOG_DIR)).filter(f => f.endsWith('.mdx') || f.endsWith('.md')).length
    report.push(
      `blog: ${blogPosts} posts under data/blog are not in the docs nav, so none is converted (the nav links only the /blog index from the site footer)`
    )

    const llms = readFileSync(join(root, 'llms', 'llms-full.txt'), 'utf8')
    const slugs = llmsSlugs(llms)
    const pageSlugs = pages.map(page => relative(docs, page.file).replace(/\.mdx$/, ''))
    const missing = pageSlugs.filter(slug => !slugs.has(slug))
    report.push(
      `llms-full.txt cross-check: ${pageSlugs.length - missing.length} of ${pageSlugs.length} pages have a matching section` +
        `${missing.length ? `; missing: ${missing.join(', ')}` : ''}`
    )

    return { root, siteUrl: SITE, pages, report }
  },
}
