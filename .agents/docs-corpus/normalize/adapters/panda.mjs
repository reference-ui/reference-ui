/**
 * Panda CSS adapter. The live page list and its order come from the docs nav
 * (`website/src/docs.config.tsx`, `docsTabs`): each entry `docs/<tab>/<url>`
 * is one page, and its content is `website/content/docs/<tab>/<url>.mdx`.
 * Blog posts and MDX files that the nav does not route are excluded and
 * reported. `llms/llms-full.txt` is cross-checked by page title.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { stripTypeScriptTypes } from 'node:module'
import { parseFrontmatter } from '../lib/frontmatter.mjs'
import { stringList } from '../lib/mdx.mjs'

const SOURCE = 'panda'
const DOCS_PREFIX = '/docs/'

/** The site renders these tables from the Panda preset at build time; the clone keeps only the JSX. */
const PRESET_NOTE = 'The site builds this table from the Panda preset, which this clone does not include.'

const TOKEN_LISTS = {
  breakpoints: 'the default breakpoints and their widths',
  colors: 'the default colors and their values',
  spacing: 'the default spacing scale and its values',
  radii: 'the default border radii and their values',
  shadows: 'the default shadows and their values',
  sizing: 'the default sizes and their values',
  fonts: 'the default font families and their values',
  fontSizes: 'the default font sizes and their values',
  keyframes: 'the default keyframe animations',
}

/**
 * Hooks for the site's data components. llms-full.txt keeps both components as
 * raw JSX, so their rows are not in the clone: each becomes a one-line note.
 */
export const components = {
  UtilityTable(props) {
    const groups = stringList(props.groups)
    const properties = stringList(props.properties)
    const label = typeof props.label === 'string' ? `${props.label} ` : ''
    let what = 'every utility'
    if (properties.length) what = `the ${label}utilities ${properties.join(', ')}`
    else if (groups.length) what = `every utility in the ${groups.join(' and ')} ${groups.length > 1 ? 'groups' : 'group'}`
    return `> Table: lists ${what}, with their CSS properties and values. ${PRESET_NOTE}`
  },
  TokenDocs(props) {
    const type = String(props.type ?? '')
    const what = Object.hasOwn(TOKEN_LISTS, type) ? TOKEN_LISTS[type] : `the default ${type} values`
    return `> Table: lists ${what}. ${PRESET_NOTE}`
  },
}

const TYPE_BY_GROUP = {
  'get-started': {
    Overview: 'concept',
    Installation: 'install',
    Frameworks: 'install',
    'Using AI': 'ai',
    Migration: 'migration',
  },
  styling: { 'Write styles': 'guide', JSX: 'api-reference', 'Build & output': 'guide', Advanced: 'guide' },
  recipes: { 'Write recipes': 'guide', 'JSX Usage': 'guide', Advanced: 'guide' },
  theming: { Theme: 'theming', 'Composite Styles': 'theming', Customization: 'theming', Guides: 'theming' },
  'design-systems': { Start: 'guide', 'Write components': 'guide', 'Ship the library': 'guide', Governance: 'guide' },
  reference: { 'CLI & Config': 'api-reference', 'Styled System': 'api-reference', 'Utility Reference': 'api-reference' },
}

const TYPE_BY_SLUG = {
  'get-started/faq': 'faq',
  'get-started/upgrading-to-v2': 'migration',
  'get-started/linting': 'guide',
  'design-systems/linting': 'guide',
  'design-systems/deprecations': 'changelog',
  'reference/deprecations': 'changelog',
  'reference/debugging': 'guide',
  'reference/diagnostics': 'guide',
}

/** Nav module, with its TypeScript types stripped and no external imports. */
async function loadNav(file) {
  const js = stripTypeScriptTypes(readFileSync(file, 'utf8'))
  return import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)
}

/** Every leaf nav entry, with its tab and its nearest group title. */
function navEntries(tabs) {
  const out = []
  const walk = (tab, nodes, group) => {
    for (const node of nodes) {
      if (Array.isArray(node.items)) walk(tab, node.items, node.title)
      else out.push({ ...node, tab, group })
    }
  }
  for (const tab of tabs) walk(tab, tab.items, '')
  return out
}

function isExternal(entry) {
  return Boolean(entry.external) || /^https?:/.test(entry.href ?? '')
}

/** The docs slug (`<tab>/<url>`) a nav entry routes to, or null. */
function slugOf(entry) {
  if (entry.url && !entry.href) return `${entry.tab.key}/${entry.url}`
  if (entry.href?.startsWith(DOCS_PREFIX)) return entry.href.slice(DOCS_PREFIX.length)
  return null
}

function typeOf(slug, entry) {
  return TYPE_BY_SLUG[slug] ?? TYPE_BY_GROUP[entry.tab.key]?.[entry.group] ?? 'other'
}

function sectionOf(entry) {
  return entry.group ? `${entry.tab.title} / ${entry.group}` : entry.tab.title
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

/** Page titles in llms-full.txt's table of contents (lines before the first H1). */
function llmsTocTitles(text) {
  const lines = text.split('\n')
  const start = lines.indexOf('## Table of Contents')
  if (start === -1) return []
  const end = lines.findIndex((line, i) => i > start && /^# /.test(line))
  return lines
    .slice(start, end === -1 ? undefined : end)
    .map(line => line.match(/^- \[(.+?)\]\(#/)?.[1])
    .filter(Boolean)
}

const norm = text => text.toLowerCase().replace(/&amp;/g, '&').replace(/[^a-z0-9]+/g, ' ').trim()

function crossCheck(pages, llmsText) {
  const llmsTitles = llmsTocTitles(llmsText)
  const llmsSet = new Set(llmsTitles.map(norm))
  const pageSet = new Set(pages.map(p => norm(p.title)))
  return {
    llmsCount: llmsTitles.length,
    onlyInDocs: pages.filter(p => !llmsSet.has(norm(p.title))).map(p => p.title),
    onlyInLlms: llmsTitles.filter(t => !pageSet.has(norm(t))),
  }
}

export default {
  source: SOURCE,

  async collect({ vendorDir, entry }) {
    const root = join(vendorDir, SOURCE)
    const site = join(root, 'website')
    const pathBase = `vendor/docs/${SOURCE}/website/content/docs`
    const nav = await loadNav(join(site, 'src', 'docs.config.tsx'))
    const siteUrl = nav.docsConfig.url

    const report = []
    const navSlugs = new Set()
    const noMdx = []
    const pages = []
    let external = 0

    for (const navEntry of navEntries(nav.docsTabs)) {
      if (isExternal(navEntry)) {
        external++
        continue
      }
      const slug = slugOf(navEntry)
      if (!slug) {
        noMdx.push(`${navEntry.title} (${navEntry.href}): nav route with no MDX`)
        continue
      }
      if (navSlugs.has(slug)) continue
      navSlugs.add(slug)
      const file = join(site, 'content', 'docs', `${slug}.mdx`)
      if (!existsSync(file)) {
        noMdx.push(`${navEntry.title} (${slug}): no MDX file`)
        continue
      }
      const { data, body } = parseFrontmatter(readFileSync(file, 'utf8'))
      pages.push({
        slug,
        title: data.title || navEntry.title,
        description: data.description ?? '',
        url: `${siteUrl}${DOCS_PREFIX}${slug}`,
        section: sectionOf(navEntry),
        type: typeOf(slug, navEntry),
        path: `${pathBase}/${slug}.mdx`,
        file,
        format: 'mdx',
        text: body,
      })
    }

    const notInNav = mdxFiles(join(site, 'content', 'docs')).filter(slug => !navSlugs.has(slug))
    const blogCount = mdxFiles(join(site, 'content', 'blog')).length
    report.push(
      `nav: ${pages.length} live pages with MDX; ${external} external links skipped; blog excluded: ${blogCount} posts (not in nav)`
    )
    for (const line of noMdx) report.push(`nav without content: ${line}`)
    for (const slug of notInNav) report.push(`MDX not in nav (excluded): ${slug}`)

    const llms = readFileSync(join(root, 'llms', 'llms-full.txt'), 'utf8')
    const cross = crossCheck(pages, llms)
    report.push(`llms-full.txt TOC: ${cross.llmsCount} entries; pages ${pages.length}`)
    report.push(`llms cross-check, in docs but not llms-full (${cross.onlyInDocs.length}): ${cross.onlyInDocs.join(' | ') || 'none'}`)
    report.push(`llms cross-check, in llms-full but not docs (${cross.onlyInLlms.length}): ${cross.onlyInLlms.join(' | ') || 'none'}`)

    return { root, pages, report, siteUrl }
  },
}
