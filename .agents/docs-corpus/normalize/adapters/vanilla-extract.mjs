/**
 * vanilla-extract adapter. The page list, order and sections come from the docs
 * nav (`site/contents.mts`, the clone's extra): each group lists page slugs, and
 * each page's source is `site/docs/<group>/<slug>.md`. The pages are plain
 * Markdown with fenced code, so the body is used as written; only root-relative
 * links become absolute. The title is the page's own first H1, which the live
 * page shows. `docs/treat-migration-guide.md` is not in the nav, so it is
 * excluded and reported.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { stripTypeScriptTypes } from 'node:module'
import { parseFrontmatter } from '../lib/frontmatter.mjs'

const SOURCE = 'vanilla-extract'
const SITE = 'https://vanilla-extract.style'
const DOCS_PATH = '/documentation/'
const OVERVIEW = 'overview'

/** Page types for the Overview pages, which need one each; the other groups share a type. */
const TYPE_BY_SLUG = {
  'overview/getting-started': 'install',
  'overview/styling': 'guide',
  'overview/theming': 'theming',
  'overview/style-composition': 'concept',
  'overview/test-environments': 'guide',
}
const TYPE_BY_GROUP = {
  api: 'api-reference',
  'global-api': 'api-reference',
  packages: 'api-reference',
  integrations: 'install',
}

const FENCE_OPEN = /^(\s*)(`{3,}|~{3,})(.*)$/
const FENCE_CLOSE = /^\s*(`{3,}|~{3,})\s*$/
const CODE_SPAN = /(`+)[\s\S]*?\1/g
const INLINE_ROOT_LINK = /\]\(\/(?!\/)/g
const REFERENCE_ROOT_LINK = /^(\s*\[[^\]]+\]:\s*)\/(?!\/)/
const JSX_TAG = /<\/?[A-Z][\w.]*(?=[\s/>]|$)/g

/** The nav module with its TypeScript types stripped, loaded from a data URL (as the panda adapter does). */
async function loadNav(file) {
  const js = stripTypeScriptTypes(readFileSync(file, 'utf8'))
  return import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)
}

/** Every .md file under a directory, relative to `base`, skipping .git. */
function markdownFiles(dir, base = dir, out = []) {
  for (const name of readdirSync(dir).sort()) {
    if (name === '.git') continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) markdownFiles(full, base, out)
    else if (name.endsWith('.md')) out.push(relative(base, full))
  }
  return out
}

/** The live URL. Overview pages sit at the docs root; the other groups sit under their group. */
function liveUrl(group, page) {
  const prefix = group === OVERVIEW ? '' : `${group}/`
  return `${SITE}${DOCS_PATH}${prefix}${page}/`
}

/** The text of the body's first line when that line is an H1, else null. */
function leadingH1(body) {
  const first = body.split('\n').find(line => line.trim() !== '')
  const match = first?.match(/^#\s+(.+?)\s*$/)
  return match ? match[1] : null
}

/** Applies fn to the prose parts of one line, skipping inline code spans. */
function prose(line, fn) {
  let out = ''
  let last = 0
  for (const match of line.matchAll(CODE_SPAN)) {
    out += fn(line.slice(last, match.index)) + match[0]
    last = match.index + match[0].length
  }
  return out + fn(line.slice(last))
}

/**
 * The body with root-relative links made absolute on the live site, as the shared
 * converter does for MDX. Fenced code and code spans are never touched. JSX-like
 * tags in prose are counted, so a component added later cannot pass unnoticed.
 */
function convertBody(body) {
  const counts = { inline: 0, reference: 0, jsx: 0 }
  let fence = null
  const lines = body.replace(/\r\n?/g, '\n').split('\n').map(line => {
    if (fence) {
      const close = line.match(FENCE_CLOSE)
      if (close && close[1][0] === fence[0] && close[1].length >= fence.length) fence = null
      return line
    }
    const open = line.match(FENCE_OPEN)
    if (open && !(open[2][0] === '`' && open[3].includes('`'))) {
      fence = open[2]
      return line
    }
    let text = line
    const reference = text.match(REFERENCE_ROOT_LINK)
    if (reference) {
      counts.reference++
      text = `${reference[1]}${SITE}/${text.slice(reference[0].length)}`
    }
    return prose(text, part => {
      counts.inline += part.match(INLINE_ROOT_LINK)?.length ?? 0
      counts.jsx += part.match(JSX_TAG)?.length ?? 0
      return part.replace(INLINE_ROOT_LINK, `](${SITE}/`)
    })
  })
  return { markdown: lines.join('\n'), counts }
}

export default {
  source: SOURCE,

  async collect({ vendorDir }) {
    const root = join(vendorDir, SOURCE)
    const docs = join(root, 'site', 'docs')
    const nav = await loadNav(join(root, 'site', 'contents.mts'))

    const navSlugs = new Set()
    const pages = []
    const noContent = []
    const retitled = []
    const totals = { inline: 0, reference: 0, jsx: 0 }

    for (const group of nav.contents) {
      for (const page of group.pages) {
        const slug = `${group.group}/${page}`
        if (navSlugs.has(slug)) continue
        navSlugs.add(slug)
        const file = join(docs, `${slug}.md`)
        if (!existsSync(file)) {
          noContent.push(slug)
          continue
        }
        const { data, body } = parseFrontmatter(readFileSync(file, 'utf8'))
        const h1 = leadingH1(body)
        const title = h1 ?? data.title
        if (!title) throw new Error(`site/docs/${slug}.md has neither an H1 nor a frontmatter title`)
        if (h1 && data.title && data.title !== h1) retitled.push(`${slug} (frontmatter "${data.title}")`)
        const type = TYPE_BY_SLUG[slug] ?? TYPE_BY_GROUP[group.group]
        if (!type) throw new Error(`nav group '${group.group}' has no page type in adapters/${SOURCE}.mjs`)
        const converted = convertBody(body)
        for (const key of Object.keys(totals)) totals[key] += converted.counts[key]
        pages.push({
          slug,
          title,
          description: '',
          url: liveUrl(group.group, page),
          section: group.label,
          type,
          path: `vendor/docs/${SOURCE}/site/docs/${slug}.md`,
          file,
          format: 'md',
          text: converted.markdown,
        })
      }
    }

    const notInNav = markdownFiles(root).filter(
      rel => !(rel.startsWith('site/docs/') && navSlugs.has(rel.slice('site/docs/'.length, -'.md'.length)))
    )

    const report = [
      `nav: ${pages.length} pages in ${nav.contents.length} groups (site/contents.mts); live URL /documentation/<group>/<page>/, Overview pages at /documentation/<page>/`,
    ]
    for (const slug of noContent) report.push(`nav without content (skipped): ${slug}`)
    report.push(`titles: each page's first H1; frontmatter title differs on ${retitled.length}: ${retitled.join(', ') || 'none'}`)
    report.push(
      `links made absolute: ${totals.inline} inline, ${totals.reference} reference definitions; fenced code and code spans unchanged`
    )
    report.push(`JSX-like tags in prose: ${totals.jsx}${totals.jsx ? ' (kept as written; needs a components hook)' : ''}`)
    report.push('demo source: none in the clone; examples are fenced code in the pages')
    report.push(`not in nav (excluded): ${notInNav.join(', ') || 'none'}`)

    return { root, siteUrl: SITE, pages, report }
  },
}
