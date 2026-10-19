/**
 * Component hooks for primer-design's block-level JSX. Wrappers (Box, Text,
 * DoDontContainer, RailsProvider) return their converted children unchanged.
 * Do, Dont, Note and Caption get labels in the source's own words. Demos,
 * tables and grids the site builds at build time become a one-line note: the
 * clone does not hold their data, so nothing is invented.
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { findGroup, parseNav } from './nav.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const LIVE = JSON.parse(readFileSync(join(HERE, 'live-map.json'), 'utf8')).pages
const SITEMAP = new Set(
  JSON.parse(readFileSync(join(HERE, 'sitemap.json'), 'utf8')).urls.map(entry => entry.url.replace(/\/$/, ''))
)

/** The nav tree, read once from the clone the first time a hook needs it. */
let navTree = null
function navOf(ctx) {
  navTree ??= parseNav(readFileSync(join(ctx.root, 'src/@primer/gatsby-theme-doctocat/nav.yml'), 'utf8'))
  return navTree
}

const SITE = 'https://primer.style'
const BUILT_AT_BUILD = 'The site builds this at build time, which this clone does not include.'

const headingLevel = (as, fallback) => (typeof as === 'string' && /^h[1-6]$/.test(as) ? Number(as[1]) : fallback)
const oneLine = text => String(text ?? '').replace(/\s+/g, ' ').trim()
const quote = body => body.split('\n').map(line => (line.trim() ? `> ${line}` : '>'))
const labelled = (label, body) => (body.trim() ? `**${label}**\n\n${body}` : `**${label}**`)
const unwrap = (props, children) => children

export const components = {
  Box: unwrap,
  RailsProvider: unwrap,
  DoDontContainer: unwrap,
  ImageContainer: unwrap,

  /** `as="h3"` makes the text a heading; otherwise it is a paragraph. */
  Text(props, children) {
    const level = headingLevel(props.as, 0)
    return level ? `${'#'.repeat(level)} ${oneLine(children)}` : children
  },

  Heading(props, children) {
    return `${'#'.repeat(headingLevel(props.as, 2))} ${oneLine(children)}`
  },

  Caption: (props, children) => children,

  Do: (props, children) => labelled('Do:', children),

  Dont: (props, children) => labelled("Don't:", children),

  /** Note variants map like callouts: warning to Warning, danger to Caution, anything else to Note. */
  Note(props, children) {
    const kind = { warning: 'Warning', danger: 'Caution' }[props.variant] ?? 'Note'
    const body = String(children).trim()
    return [`> **${kind}:**`, '>', ...(body ? quote(body) : [])].join('\n')
  },

  ImageBox(props, children) {
    const caption = typeof props.caption === 'string' ? props.caption : ''
    return [children, caption].filter(part => part.trim()).join('\n\n')
  },

  CustomVideoPlayer(props) {
    const src = typeof props.src === 'string' ? props.src : ''
    return src ? `> **Video:** [demo](${src})` : '> **Video:**'
  },

  /** The embedded Storybook story ids; the story itself is not in the clone. */
  StorybookEmbed(props) {
    const ids = [...String(props.stories ?? '').matchAll(/id:\s*['"]([^'"]+)['"]/g)].map(m => `\`${m[1]}\``)
    const framework = typeof props.framework === 'string' ? ` (${props.framework})` : ''
    if (!ids.length) return `> **Demo:** Storybook${framework}`
    return `> **Demo:** Storybook ${ids.length > 1 ? 'stories' : 'story'} ${ids.join(', ')}${framework}`
  },

  /** A link to the component's accessibility page, when the live site has that page. */
  AccessibilityLink(props) {
    const label = typeof props.label === 'string' ? props.label : ''
    const slug = label.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
    const target = `${SITE}/product/components/${slug}/accessibility`
    return SITEMAP.has(target) ? `> **Accessibility:** [${label}](${target}/)` : `> **Accessibility:** ${label}`
  },

  /** The live children of a nav group, listed by their live URLs. */
  ChildPages(props, children, ctx) {
    const group = findGroup(navOf(ctx), String(props.path ?? ''))
    if (!group) return null
    const items = []
    for (const child of group.children) {
      const rec = child.url === undefined ? null : LIVE[child.url]
      if (rec && rec.status !== 'dead') items.push(`- [${child.title}](${rec.live})`)
    }
    return items.join('\n')
  },

  ThemeReferenceTree: () => `> Tree: lists the default theme object and its values. ${BUILT_AT_BUILD}`,

  StatusTable: () => `> Table: lists the status of each component. ${BUILT_AT_BUILD}`,

  Icons: () => `> Grid: lists the Octicons icons. ${BUILT_AT_BUILD}`,
}
