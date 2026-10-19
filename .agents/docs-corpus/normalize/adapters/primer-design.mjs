/**
 * primer-design adapter: the archived primer/design docs, as they live on
 * https://primer.style. Pages, titles, sections and order come from the clone's
 * nav config. Each nav page takes its live URL from adapters/primer-design/
 * live-map.json; pages the site no longer serves are excluded and reported.
 * Clone files the nav does not route are included only when the live site
 * still links them from a docs section (extra-pages.json). The body text is
 * the archived text: prose.mjs converts markup only, and the hooks in
 * hooks.mjs resolve block JSX.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { parseFrontmatter } from '../lib/frontmatter.mjs'
import { navPages, parseNav } from './primer-design/nav.mjs'
import { prepareProse } from './primer-design/prose.mjs'

export { components } from './primer-design/hooks.mjs'

const SOURCE = 'primer-design'
const SITE = 'https://primer.style'
const DATA = new URL('./primer-design/', import.meta.url)
const readData = name => JSON.parse(readFileSync(new URL(name, DATA), 'utf8'))
const LIVE = readData('live-map.json').pages
const EXTRA = readData('extra-pages.json')
const SITEMAP = readData('sitemap.json').urls

const liveFor = path => {
  const rec = LIVE[path]
  return rec && rec.status !== 'dead' ? rec.live : null
}

/** Page type from the slug: the nav groups do not carry one. */
function typeOf(slug) {
  if (slug === 'components' || slug.startsWith('components/')) return 'component'
  if (slug.startsWith('guides/rails/migration-guides')) return 'migration'
  if (['guides/rails', 'guides/react', 'guides/figma/getting-started'].includes(slug)) return 'install'
  if (slug.startsWith('foundations/primitives') || slug === 'guides/react/theming') return 'theming'
  if (
    slug.startsWith('guides/react/hooks') ||
    ['guides/react/theme-reference', 'guides/react/system-props'].includes(slug) ||
    slug.startsWith('foundations/css-utilities') ||
    slug.startsWith('foundations/icons')
  ) return 'api-reference'
  if (
    ['guides/introduction', 'guides/react/philosophy', 'guides/component-lifecycle', 'guides/status'].includes(slug) ||
    slug === 'foundations' || slug.startsWith('foundations/')
  ) return 'concept'
  return 'guide'
}

/** The content file a nav url renders from: `<url>.mdx`, or `<url>/index.mdx`. */
function contentFile(content, url) {
  const rel = url.replace(/^\//, '')
  for (const name of [`${rel}.mdx`, `${rel}/index.mdx`, `${rel}.md`, `${rel}/index.md`]) {
    const file = join(content, name)
    if (existsSync(file)) return file
  }
  return null
}

/** Every .mdx and .md file under the content folder, relative to it. */
function contentFiles(dir, base = dir, out = []) {
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) contentFiles(full, base, out)
    else if (/\.mdx?$/.test(name)) out.push(relative(base, full))
  }
  return out
}

const bare = url => url.replace(/\/+$/, '')

export default {
  source: SOURCE,

  async collect({ vendorDir, entry }) {
    const root = join(vendorDir, SOURCE)
    const content = join(root, 'content')
    const nav = parseNav(readFileSync(join(root, 'src', '@primer', 'gatsby-theme-doctocat', 'nav.yml'), 'utf8'))
    const report = []
    const decided = new Set()
    const dead = []
    const noFile = []

    const makePage = (file, fields) => {
      const { data, body } = parseFrontmatter(readFileSync(file, 'utf8'))
      decided.add(relative(content, file))
      return {
        slug: fields.slug,
        title: fields.title || data.title || '',
        description: data.description ?? '',
        url: fields.url,
        section: fields.section,
        type: fields.type,
        path: `vendor/docs/${SOURCE}/${relative(root, file)}`,
        file,
        format: 'mdx',
        text: prepareProse(body, { pageUrl: fields.url, siteUrl: SITE, liveFor }),
      }
    }

    // The nav pages, in nav order.
    const navSlots = []
    for (const item of navPages(nav)) {
      const live = LIVE[item.url]
      if (!live) throw new Error(`nav url ${item.url} has no entry in adapters/primer-design/live-map.json; re-probe the site`)
      const file = contentFile(content, item.url)
      if (live.status === 'dead') {
        dead.push(item.url)
        if (file) decided.add(relative(content, file))
        continue
      }
      if (!file) {
        noFile.push(item.url)
        continue
      }
      const slug = item.url.replace(/^\//, '')
      navSlots.push({
        url: item.url,
        page: makePage(file, {
          slug,
          title: item.title,
          url: live.live,
          section: item.ancestors.length ? item.ancestors.join(' / ') : item.title,
          type: typeOf(slug),
        }),
      })
    }

    // Clone files the nav does not route, placed beside their nav neighbour.
    const beforeAnchor = new Map()
    const afterAnchor = new Map()
    const atEnd = []
    const navUrls = new Set(navSlots.map(slot => slot.url))
    for (const item of EXTRA.include) {
      const file = join(content, item.file)
      if (!existsSync(file)) throw new Error(`extra-pages.json: ${item.file} is not in the clone`)
      const slug = item.slug ?? item.file.replace(/\.mdx?$/, '')
      const page = makePage(file, { slug, title: item.title, url: item.url, section: item.section, type: item.type })
      const anchor = item.before ?? item.after
      if (!anchor || !navUrls.has(anchor)) atEnd.push(page)
      else {
        const side = item.before ? beforeAnchor : afterAnchor
        side.set(anchor, [...(side.get(anchor) ?? []), page])
      }
    }
    for (const item of EXTRA.exclude) {
      if (!existsSync(join(content, item.file))) throw new Error(`extra-pages.json: ${item.file} is not in the clone`)
      decided.add(item.file)
    }

    const pages = []
    for (const slot of navSlots) {
      pages.push(...(beforeAnchor.get(slot.url) ?? []), slot.page, ...(afterAnchor.get(slot.url) ?? []))
    }
    pages.push(...atEnd)

    const undecided = contentFiles(content).filter(file => !decided.has(file))
    if (undecided.length) throw new Error(`content files with no decision in nav or extra-pages.json: ${undecided.join(', ')}`)

    // Coverage: the live docs pages in the sitemap, against the URLs written.
    const liveDocs = new Set(SITEMAP.map(entry => bare(entry.url)))
    const written = new Set(pages.map(page => bare(page.url)))
    const covered = [...liveDocs].filter(url => written.has(url))
    const missing = [...liveDocs].filter(url => !written.has(url))
    const outside = [...written].filter(url => !liveDocs.has(url))

    report.push(`nav: ${navSlots.length} pages from nav urls with a live page (${navSlots.filter(s => LIVE[s.url].status === 'moved').length} moved to a new live URL)`)
    report.push(`extra: ${EXTRA.include.length} clone files outside the nav, included because the live docs still link them`)
    report.push(`no live page, excluded (${dead.length}): ${dead.join(' ') || 'none'}`)
    if (noFile.length) report.push(`nav urls with no content file: ${noFile.join(' ')}`)
    report.push(`excluded clone files (${EXTRA.exclude.length}): ${EXTRA.exclude.map(item => item.file).join(' ')}`)
    report.push(`coverage: live ${liveDocs.size} / normalized ${covered.length} / missing ${missing.length}`)
    report.push(`written: ${pages.length} pages; live URLs outside the sitemap: ${outside.length} (${outside.join(' ') || 'none'})`)

    return { root, siteUrl: SITE, pages, report }
  },
}
