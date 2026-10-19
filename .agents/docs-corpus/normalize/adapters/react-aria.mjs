/**
 * react-aria source adapter. Three live docs sites come from this clone:
 *   React Aria            https://react-aria.adobe.com/          (pages/react-aria, s2-docs)
 *   React Spectrum (S2)   https://react-spectrum.adobe.com/      (pages/s2, s2-docs; the host root)
 *   React Spectrum v3     https://react-spectrum.adobe.com/v3/   (dev/docs and @adobe/react-spectrum/docs)
 * Pages, sections, order and URLs are in adapters/react-aria/source.mjs and nav.mjs; the prose
 * pre-pass in prose.mjs; the component hooks in hooks.mjs. The trees the
 * clone holds that are not live pages are listed in EXCLUDED, with the reason,
 * and every run prints that list.
 */

import { relative, join } from 'node:path'
import { discoverPages } from './react-aria/source.mjs'
import { prepareProse } from './react-aria/prose.mjs'
import { setPageRegistry } from './react-aria/registry.mjs'

export { components } from './react-aria/hooks.mjs'

const SOURCE = 'react-aria'

/** Trees in the clone that are not live docs pages; each line is in the report. */
const EXCLUDED = [
  'pages/react-aria/error.mdx and pages/s2/error.mdx: the 404 template, served for unknown routes',
  'packages/dev/s2-docs/pages/index.mdx: the old root welcome; the live root serves the S2 home (pages/s2/index.mdx)',
  'packages/dev/docs/pages/index.mdx: the old root libraries landing; no live route',
  'packages/@internationalized/{date,number}/docs: v3-era package docs; no live route (v3/internationalized is 404)',
  '.storybook-s2/docs: Storybook-only pages; no live route',
  'docs/contributing: repository contributor docs, not on either site (contributing is 404)',
  'packages/dev/s2-docs/migration-references: raw reference files, not site pages (404)',
]

export default {
  source: SOURCE,

  async collect({ vendorDir, entry }) {
    const root = join(vendorDir, SOURCE)
    const found = discoverPages(root)
    setPageRegistry(found)
    const pages = found.map(page => ({
      slug: page.slug,
      title: page.title,
      description: page.description,
      url: page.url,
      section: page.section,
      type: page.type,
      path: `vendor/docs/${SOURCE}/${relative(root, page.file)}`,
      file: page.file,
      format: 'mdx',
      text: prepareProse(page.text, page.url),
    }))
    const count = site => found.filter(page => page.site === site).length
    const report = [
      `live pages: ${pages.length} (React Aria ${count('ra')}, React Spectrum (S2) ${count('s2')}, React Spectrum v3 ${count('v3')}, host root ${count('root')})`,
      'nav: React Aria and S2 sections from the page exports (section, group); v3 sections from the live sidebar snapshot (nav.mjs)',
      ...EXCLUDED.map(line => `excluded, not live docs: ${line}`),
    ]
    return { root, siteUrl: '', pages, report }
  },
}
