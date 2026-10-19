/**
 * Page discovery for the react-aria source. One clone feeds three live sites:
 *   React Aria            https://react-aria.adobe.com/         pages/react-aria/**
 *   React Spectrum (S2)   https://react-spectrum.adobe.com/     pages/s2/** (the host root, no /s2 prefix)
 *   React Spectrum v3     https://react-spectrum.adobe.com/v3/  nav.mjs, with its files in dev/docs and @adobe/react-spectrum/docs
 * The S2 and React Aria pages are every MDX under pages/<dir>/ (the glob in src/getPages.ts, which the
 * site's nav is built from), minus the 404 template. Their section and group come from the page exports.
 * The v3 nav config is not in the clone, so nav.mjs carries the live sidebar. Architecture and contribute
 * are live at the host root but outside the nav.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { basename, join, relative } from 'node:path'
import { V3_NAV } from './nav.mjs'

export const SITES = {
  ra: { label: 'React Aria', base: 'https://react-aria.adobe.com' },
  s2: { label: 'React Spectrum (S2)', base: 'https://react-spectrum.adobe.com' },
  v3: { label: 'React Spectrum v3', base: 'https://react-spectrum.adobe.com/v3' },
}

const PAGE_DIRS = { 'react-aria': 'ra', s2: 's2' }
const S2_PAGES = 'packages/dev/s2-docs/pages'
const V3_DOCS = 'packages/dev/docs/pages'
const V3_COMPONENTS = 'packages/@adobe/react-spectrum/docs'

/**
 * A source file's text without its metadata block: the `---` block of flat `key: value` lines that the v3
 * pages put after their imports (category, description, keywords). Returns the body and the block's keys.
 */
export function readSource(file) {
  const raw = readFileSync(file, 'utf8')
  const block = raw.match(/^---\n((?:[A-Za-z_][\w-]*:[^\n]*\n)+)---\n/m)
  if (!block) return { text: raw, meta: {} }
  const meta = {}
  for (const line of block[1].split('\n')) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/)
    if (kv) meta[kv[1]] = kv[2].replace(/^(['"])(.*)\1$/, '$2')
  }
  return { text: raw.replace(block[0], ''), meta }
}

/** Every .mdx under dir, sorted, absolute. */
export function mdxUnder(dir) {
  const out = []
  const walk = d => {
    for (const name of readdirSync(d).sort()) {
      const full = join(d, name)
      if (statSync(full).isDirectory()) walk(full)
      else if (name.endsWith('.mdx')) out.push(full)
    }
  }
  walk(dir)
  return out
}

/** The URL of an index-like name: `index` is the site root, `blog/index` is `blog/`. */
function urlOf(base, name) {
  if (name === 'index') return `${base}/`
  if (name.endsWith('/index')) return `${base}/${name.slice(0, -'index'.length)}`
  return `${base}/${name}`
}

/** A page slug: `index` stays, `blog/index` is `blog`, every slug starts with the site prefix. */
function slugOf(prefix, name) {
  return `${prefix}${name.endsWith('/index') ? name.slice(0, -'/index'.length) : name}`
}

/** Export text as a plain string: `export const NAME = '...'`, single or double quoted. */
export function stringExport(text, name) {
  const m = text.match(new RegExp(`^export const ${name}\\s*=\\s*(?:'((?:[^'\\\\\\n]|\\\\.)*)'|"((?:[^"\\\\\\n]|\\\\.)*)")`, 'm'))
  if (!m) return undefined
  return (m[1] ?? m[2]).replace(/\\(['"\\])/g, '$1')
}

export function flagExport(text, name) {
  return new RegExp(`^export const ${name}\\s*=\\s*true\\b`, 'm').test(text)
}

/** The literal text of a <PageDescription> (the lead paragraph), or '' when it holds only an expression. */
export function pageDescriptionText(text) {
  const m = text.match(/<PageDescription>([^{<][^<]*)<\/PageDescription>/)
  return m ? m[1].trim() : ''
}

/** The first H1 outside fenced code, or null when it holds JSX or is missing. */
export function firstH1(text) {
  let fence = null
  for (const line of text.split('\n')) {
    const f = line.match(/^\s*(`{3,}|~{3,})/)
    if (f) {
      if (!fence) fence = f[1]
      else if (line.trim().startsWith(fence)) fence = null
      continue
    }
    if (fence) continue
    const h = line.match(/^# (.+?)\s*$/)
    if (h) return /[{<]/.test(h[1]) ? null : h[1]
  }
  return null
}

const RA_SECTION_FIX = { 'getting-started': 'Getting started', mcp: 'Guides', 'examples/index': 'Examples' }
const S2_SECTION_FIX = { 'getting-started': 'Getting started', mcp: 'Guides' }

/** RA and S2 nav group: the page's `section` (and `group`) export, defaulting to Components. */
function exportedSection(site, name, text) {
  const fix = site === 'ra' ? RA_SECTION_FIX : S2_SECTION_FIX
  const group = stringExport(text, 'group')
  const section = fix[name] ?? stringExport(text, 'section') ?? 'Components'
  return group ? `${group} / ${section}` : section
}

const RA_TYPE_BY_NAME = {
  index: 'other',
  'getting-started': 'install',
  frameworks: 'install',
  mcp: 'ai',
  ai: 'ai',
  hooks: 'concept',
  collections: 'concept',
  selection: 'concept',
  dnd: 'concept',
  styling: 'guide',
  forms: 'guide',
  customization: 'guide',
  quality: 'guide',
  testing: 'guide',
}

/** RA page type, from its nav group and name. */
function raType(name, section) {
  if (RA_TYPE_BY_NAME[name]) return RA_TYPE_BY_NAME[name]
  const last = name.split('/').pop()
  if (last === 'testing') return 'guide'
  if (section.endsWith(' / Blog')) return 'blog'
  if (section.endsWith(' / Releases')) return 'changelog'
  if (section.endsWith(' / Examples')) return 'guide'
  if (section.endsWith(' / Components')) return 'component'
  if (/ \/ (Hooks|Interactions|Utilities)$/.test(section)) return 'api-reference'
  if (/ \/ (Date and Time|Numbers)$/.test(section)) return last === 'index' ? 'concept' : 'api-reference'
  if (section.endsWith(' / Guides')) return 'guide'
  return 'other'
}

const S2_TYPE_BY_NAME = {
  'getting-started': 'install',
  index: 'other',
  mcp: 'ai',
  migrating: 'migration',
  ai: 'ai',
  'ai-components': 'ai',
  collections: 'concept',
  selection: 'concept',
  dnd: 'concept',
  styling: 'guide',
  forms: 'guide',
  testing: 'guide',
  icons: 'api-reference',
  illustrations: 'api-reference',
}

/** S2 page type, from its nav group and name. */
function s2Type(name, section) {
  if (S2_TYPE_BY_NAME[name]) return S2_TYPE_BY_NAME[name]
  if (name.split('/').pop() === 'testing') return 'guide'
  if (section.endsWith('Releases')) return 'changelog'
  if (section.endsWith('Reference')) return 'api-reference'
  if (section.endsWith('Guides')) return 'guide'
  if (section.endsWith('Components')) return 'component'
  return 'other'
}

const V3_TYPE_BY_SLUG = {
  'getting-started': 'install',
  'releases/index': 'changelog',
  Support: 'faq',
  versioning: 'guide',
  collections: 'concept',
  layout: 'guide',
  selection: 'concept',
  styling: 'guide',
  testing: 'guide',
  theming: 'theming',
  ssr: 'guide',
  routing: 'guide',
  forms: 'guide',
  dnd: 'concept',
  index: 'other',
  'custom-icons': 'api-reference',
  'workflow-icons': 'api-reference',
}

/**
 * Pages of the RA and S2 trees. Each: { site, slug, name, file, url, section, type, title, description }.
 * The nav section is the group export and section export, not a directory name.
 */
function sitePages(root) {
  const pagesDir = join(root, S2_PAGES)
  const out = []
  for (const dirName of readdirSync(pagesDir).sort()) {
    if (!statSync(join(pagesDir, dirName)).isDirectory()) continue
    const site = PAGE_DIRS[dirName]
    if (!site) throw new Error(`${S2_PAGES}/${dirName}: no site mapping in source.mjs`)
    const prefix = site === 's2' ? 's2/' : ''
    for (const file of mdxUnder(join(pagesDir, dirName))) {
      const name = relative(join(pagesDir, dirName), file).slice(0, -'.mdx'.length)
      if (name === 'error') continue
      const { text } = readSource(file)
      const section = exportedSection(site, name, text)
      const label = SITES[site].label
      out.push({
        site,
        name,
        file,
        slug: slugOf(prefix, name),
        url: urlOf(SITES[site].base, name),
        section: `${label} / ${section}`,
        type: site === 'ra' ? raType(name, `${label} / ${section}`) : s2Type(name, `${label} / ${section}`),
        title: firstH1(text) ?? stringExport(text, 'title') ?? basename(name),
        description: stringExport(text, 'description') ?? (pageDescriptionText(text) || ''),
        text,
      })
    }
  }
  return out
}

/** v3 files by basename: dev/docs/pages/react-spectrum and the @adobe/react-spectrum docs. */
function v3FilesByName(root) {
  const byName = new Map()
  const add = file => {
    const key = basename(file, '.mdx')
    byName.set(key, [...(byName.get(key) ?? []), file])
  }
  for (const f of mdxUnder(join(root, V3_DOCS, 'react-spectrum'))) add(f)
  for (const f of mdxUnder(join(root, V3_COMPONENTS))) add(f)
  return byName
}

/** The v3 nav slug's file: index and releases/index are fixed, the rest match by basename. */
function v3FileFor(root, slug, byName) {
  if (slug === 'index') return join(root, V3_DOCS, 'react-spectrum', 'index.mdx')
  if (slug === 'releases/index') return join(root, V3_DOCS, 'releases', 'index.mdx')
  const found = byName.get(slug) ?? []
  if (found.length !== 1) throw new Error(`v3 nav '${slug}': ${found.length} source files in the clone (need 1)`)
  return found[0]
}

const V3_SECTION_TITLE = 'React Spectrum v3'

/** v3 pages: the nav (in order), then the release notes, then the two root pages live outside the nav. */
function v3Pages(root) {
  const byName = v3FilesByName(root)
  const out = []
  const navSlugs = new Set()
  for (const group of V3_NAV) {
    for (const navSlug of group.slugs) {
      navSlugs.add(navSlug)
      const slug = navSlug === 'releases/index' ? 'releases' : navSlug
      const file = v3FileFor(root, navSlug, byName)
      const { text, meta } = readSource(file)
      const path = slug === 'index' ? '' : slug === 'releases' ? 'releases/' : slug
      out.push({
        site: 'v3',
        name: navSlug,
        file,
        slug: `v3/${slug}`,
        url: `${SITES.v3.base}/${path}`,
        section: `${V3_SECTION_TITLE} / ${group.title}`,
        type: V3_TYPE_BY_SLUG[navSlug] ?? 'component',
        title: firstH1(text) ?? basename(navSlug),
        description: meta.description || pageDescriptionText(text),
        text,
      })
    }
  }
  for (const file of mdxUnder(join(root, V3_DOCS, 'releases'))) {
    const name = basename(file, '.mdx')
    if (name === 'index') continue
    const { text, meta } = readSource(file)
    out.push({
      site: 'v3',
      name: `releases/${name}`,
      file,
      slug: `v3/releases/${name}`,
      url: `${SITES.v3.base}/releases/${name}`,
      section: `${V3_SECTION_TITLE} / Releases`,
      type: 'changelog',
      title: firstH1(text) ?? name,
      description: meta.description || pageDescriptionText(text),
      text,
    })
  }
  for (const [name, type] of [['architecture', 'concept'], ['contribute', 'guide']]) {
    const file = join(root, V3_DOCS, `${name}.mdx`)
    const { text, meta } = readSource(file)
    out.push({
      site: 'root',
      name,
      file,
      slug: name,
      url: `https://react-spectrum.adobe.com/${name}`,
      section: `${V3_SECTION_TITLE} / Other`,
      type,
      title: firstH1(text) ?? name,
      description: '',
      text,
    })
  }
  return out
}

/** Nav section order of the React Aria and S2 sites, as their sidebars and headers show them. */
const RA_NAV_ORDER = [
  'Getting started', 'Overview', 'Components', 'Hooks', 'Guides', 'Interactions', 'Utilities',
  'Internationalized / Date and Time', 'Internationalized / Numbers', 'Examples', 'Blog', 'Releases',
]
const S2_NAV_ORDER = ['Getting started', 'Overview', 'Components', 'Guides', 'Reference', 'Releases']

/** Section rank, then title in natural order (v1.9.0 before v1.10.0). */
function navOrder(order) {
  const rank = page => {
    const i = order.indexOf(page.section.slice(page.section.indexOf(' / ') + 3))
    return i === -1 ? order.length : i
  }
  return (a, b) =>
    rank(a) - rank(b) || a.title.localeCompare(b.title, 'en', { numeric: true, sensitivity: 'base' })
}

/** Every live page of the source, in site order: React Aria, S2 (each in nav order), then v3 (nav order). */
export function discoverPages(root) {
  const shared = sitePages(root)
  const ra = shared.filter(p => p.site === 'ra').sort(navOrder(RA_NAV_ORDER))
  const s2 = shared.filter(p => p.site === 's2').sort(navOrder(S2_NAV_ORDER))
  return [...ra, ...s2, ...v3Pages(root)]
}
