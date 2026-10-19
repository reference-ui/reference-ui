/**
 * Mantine adapter. One clone, two sites: mantine.dev (the docs) and
 * help.mantine.dev (the Help Center FAQ). Page order and sections come from
 * the sites' own lists (mantine.dev's nav config; the Help Center's home-page
 * order, see mantine/pages.mjs). Custom JSX is handled by the hooks in
 * mantine/hooks.mjs; demo source is read from the clone.
 *
 * Pages excluded from the nav (the 404 page, and MDX the nav does not route)
 * are listed in the report, never dropped silently.
 */

import { readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { navPages, faqPages, EXCLUDED_REASON, SITE_URL } from './mantine/pages.mjs'
import { components, LIFTED } from './mantine/hooks.mjs'
import { liftBlockElements } from './mantine/elements.mjs'

const SOURCE = 'mantine'

export { components }

/** Every .mdx under a directory, as a slug relative to it (no extension). */
function mdxSlugs(dir, base = dir, out = []) {
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) mdxSlugs(full, base, out)
    else if (name.endsWith('.mdx')) out.push(relative(base, full).replace(/\.mdx$/, ''))
  }
  return out
}

export default {
  source: SOURCE,

  async collect({ vendorDir, entry }) {
    const root = join(vendorDir, SOURCE)
    const site = join(root, 'apps', 'mantine.dev')
    const helpSite = join(root, 'apps', 'help.mantine.dev')
    const pagesDir = join(site, 'src', 'pages')
    const report = []

    const docs = await navPages(site, pagesDir, report)
    const navSlugs = new Set(docs.map(p => p.slug))
    const notInNav = mdxSlugs(pagesDir).filter(slug => !navSlugs.has(slug))
    report.unshift(`nav: ${docs.length} mantine.dev pages (MDX_NAV_DATA plus pages outside it, see below); help FAQ pages follow`)
    for (const slug of notInNav) {
      if (docs.some(p => p.slug === slug)) continue
      report.push(`MDX not in nav (excluded): ${slug}: ${EXCLUDED_REASON[slug] ?? 'not in the nav config'}`)
    }

    const faq = faqPages(helpSite)
    report.push(`help FAQ: ${faq.length} pages in ${new Set(faq.map(p => p.section)).size} categories, in the Help Center's own order`)

    const lifted = new Set(LIFTED)
    const pages = [...docs, ...faq].map(page => ({
      ...page,
      text: liftBlockElements(page.text, lifted),
      format: 'mdx',
      path: `vendor/docs/${relative(vendorDir, page.file)}`,
    }))
    return { root, siteUrl: SITE_URL, pages, report }
  },
}
