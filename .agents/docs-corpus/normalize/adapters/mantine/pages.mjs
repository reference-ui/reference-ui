/**
 * The page list. mantine.dev pages come from the site's nav config,
 * `src/mdx/mdx-nav-data.ts` (MDX_NAV_DATA): the group order, the category
 * order and the page order are the config's own, and each page's MDX file is
 * `src/pages/<slug>.mdx`. Help Center FAQ pages have no nav file in the clone,
 * so their group order (the categories the live home page shows, in that
 * order) is written here, and their order inside a group is by slug, which is
 * how the live home page lists them.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { importTsModule } from './tsload.mjs'
import { parseValue, skipSpace } from './literal.mjs'

/** The top tab each nav group sits under on the live site (its header label). */
export const TAB_LABEL = {
  gettingStarted: 'Get started',
  theming: 'Theming & Styles',
  hooks: 'Hooks',
  components: 'Components',
  extensions: 'Extensions',
  form: 'Form',
}

/**
 * Help Center categories in the order the live home page (help.mantine.dev)
 * shows them. Not in the clone. A category missing from this list fails the run.
 */
export const HELP_CATEGORY_ORDER = ['about', 'common', 'next.js', 'tooling', 'styles', 'forms', 'components', 'testing']

/** Live URLs have no trailing slash; the sitemap lists them that way. */
export const SITE_URL = 'https://mantine.dev'
export const HELP_URL = 'https://help.mantine.dev'

const PAGE_SLUG = /^[a-z0-9][a-z0-9/-]*$/

/**
 * Pages the nav config does not list that the site publishes. `why` is the
 * reason the report prints; `after` is the slug the page follows in the output;
 * `key` is its entry in MDX_DATA.
 *  - changelog/previous-versions: linked from the footer's top-level "Changelog"
 *    link, not in the sidebar. Section: "Changelog".
 *  - guides/functions-reference: in the sitemap and in llms.txt's Guides list,
 *    not in the nav config or any sidebar. Section: "Guides" (llms.txt's group),
 *    last in the guides run of the output.
 * Remove an entry to drop its page.
 */
const EXTRA_PAGES = [
  {
    slug: 'changelog/previous-versions',
    key: 'PreviousChangelogs',
    after: 'changelog/all-releases',
    section: 'Changelog',
    type: 'changelog',
    why: "linked from the footer's top-level Changelog link",
  },
  {
    slug: 'guides/functions-reference',
    key: 'FunctionsReference',
    after: 'guides/controlled-vs-uncontrolled',
    section: 'Guides',
    type: 'guide',
    why: 'in the sitemap and the llms.txt Guides list; no sidebar lists it',
  },
]

/** Why an MDX file of the clone is left out of the output (reported, never silent). */
export const EXCLUDED_REASON = {
  404: 'error page, not a docs page',
  'x/code-highlight': 'moved-page stub ("This page has moved to Code highlight section")',
}

/** Type from the page's place in the nav, with the slug overriding a few. */
export function typeOf(groupKey, category, slug) {
  if (slug.startsWith('changelog/')) return 'changelog'
  if (slug === 'guides/llms') return 'ai'
  if (category === 'Migration guides') return 'migration'
  if (slug.endsWith('getting-started') || slug.endsWith('/package') || slug === 'x/extensions') return 'install'
  if (category === 'Overview') return 'concept'
  if (groupKey === 'hooks') return 'api-reference'
  if (groupKey === 'components' || groupKey === 'extensions') return 'component'
  if (groupKey === 'form') return ['form/use-form', 'form/use-field'].includes(slug) ? 'api-reference' : 'guide'
  if (groupKey === 'theming') return category === 'Theming' ? 'theming' : 'guide'
  return 'guide'
}

/**
 * Every nav entry in config order: { groupKey, tab, category, page }. Throws
 * when the config has a group this adapter has no tab label for.
 */
export async function navEntries(site) {
  const mod = await importTsModule(join(site, 'src', 'mdx', 'mdx-nav-data.ts'))
  const out = []
  for (const [groupKey, categories] of Object.entries(mod.MDX_NAV_DATA)) {
    const tab = TAB_LABEL[groupKey]
    if (!tab) throw new Error(`nav group '${groupKey}' has no tab label in the mantine adapter`)
    for (const { category, pages } of categories) {
      for (const page of pages) out.push({ groupKey, tab, category, page })
    }
  }
  return out
}

/** The nav's MDX pages, first occurrence of each slug, in nav order, then the pages the live nav links. */
export async function navPages(site, pagesDir, report) {
  const rows = []
  const seen = new Set()
  const noFile = []
  for (const { groupKey, tab, category, page } of await navEntries(site)) {
    if (!page.slug || !PAGE_SLUG.test(page.slug.replace(/^\//, ''))) {
      noFile.push(`${page.title ?? '?'} (${page.slug ?? 'no slug'}): not a page slug`)
      continue
    }
    const slug = page.slug.replace(/^\//, '')
    if (seen.has(slug)) continue
    seen.add(slug)
    const file = join(pagesDir, `${slug}.mdx`)
    if (!existsSync(file)) {
      noFile.push(`${page.title} (${slug}): no MDX file`)
      continue
    }
    rows.push({
      slug,
      title: page.title,
      description: page.description ?? '',
      url: `${SITE_URL}/${slug}`,
      section: category ? `${tab} / ${category}` : tab,
      type: typeOf(groupKey, category, slug),
      file,
      text: readFileSync(file, 'utf8'),
    })
  }
  for (const line of noFile) report.push(`nav without content: ${line}`)
  const data = await importTsModule(join(site, 'src', 'mdx', 'mdx-data.ts'))
  for (const extra of EXTRA_PAGES) {
    const entry = data.MDX_DATA[extra.key]
    const file = join(pagesDir, `${extra.slug}.mdx`)
    if (!entry || entry.slug !== `/${extra.slug}` || !existsSync(file)) {
      throw new Error(`extra page ${extra.slug} is not in MDX_DATA as ${extra.key}, or has no MDX file`)
    }
    const row = {
      slug: extra.slug,
      title: entry.title,
      description: entry.description ?? '',
      url: `${SITE_URL}/${extra.slug}`,
      section: extra.section,
      type: extra.type,
      file,
      text: readFileSync(file, 'utf8'),
    }
    const at = rows.findIndex(r => r.slug === extra.after)
    if (at === -1) throw new Error(`extra page ${extra.slug} follows ${extra.after}, which is not in the output`)
    rows.splice(at + 1, 0, row)
    report.push(`included outside the nav config: ${extra.slug} (${extra.why})`)
  }
  return rows
}

/** `export const meta = {...}` from a Help Center page, read as literal data. */
export function helpMeta(text, file) {
  const m = /^export\s+const\s+meta\s*=\s*/m.exec(text)
  if (!m) throw new Error(`${file}: no export const meta`)
  const start = skipSpace(text, m.index + m[0].length)
  return parseValue(text, start).value
}

/** Help Center FAQ rows in the live order: category order, then slug. */
export function faqPages(help) {
  const dir = join(help, 'src', 'pages', 'q')
  const rows = []
  for (const name of readdirSync(dir).filter(n => n.endsWith('.mdx'))) {
    const file = join(dir, name)
    const text = readFileSync(file, 'utf8')
    const meta = helpMeta(text, file)
    rows.push({ slug: name.replace(/\.mdx$/, ''), meta, file, text })
  }
  const unknown = rows.filter(r => !HELP_CATEGORY_ORDER.includes(r.meta.category))
  if (unknown.length) {
    throw new Error(`help category not in HELP_CATEGORY_ORDER: ${unknown.map(r => `${r.slug} (${r.meta.category})`).join(', ')}`)
  }
  rows.sort((a, b) => {
    const byCategory = HELP_CATEGORY_ORDER.indexOf(a.meta.category) - HELP_CATEGORY_ORDER.indexOf(b.meta.category)
    if (byCategory) return byCategory
    return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0
  })
  return rows.map(r => ({
    slug: `faq/${r.slug}`,
    title: r.meta.title,
    description: r.meta.description ?? '',
    url: `${HELP_URL}/q/${r.slug}`,
    section: `Help Center / ${r.meta.category}`,
    type: 'faq',
    file: r.file,
    text: r.text,
  }))
}
