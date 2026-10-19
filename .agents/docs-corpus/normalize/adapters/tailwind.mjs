/**
 * Tailwind CSS docs adapter (tailwindcss.com; licence NONE, reference only).
 * The page list, titles, sections and order come from the docs nav config
 * (`src/app/(docs)/docs/index.tsx`): each `/docs/<slug>` entry is
 * `src/docs/<slug>.mdx`. The Installation entry opens the live tab set, whose
 * pages and framework guides are TSX, read as text (`tailwind/installation.mjs`).
 * Blog posts and the brand page are outside the nav and are not included.
 * Source cleanup lives in `tailwind/markup.mjs`; the JSX reader in `tailwind/jsx.mjs`;
 * the six content fragments in `tailwind/fragments.mjs`.
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { stripTypeScriptTypes } from 'node:module'
import { stringList } from '../lib/mdx.mjs'
import { cleanMdx, codeFence, splitBlocks, fencedBlocks, templateBody } from './tailwind/markup.mjs'
import {
  customizingYourSpacingScale,
  customizingYourTheme,
  customizingYourThemeColors,
  responsiveDesign,
  targetingSpecificStates,
  usingACustomValue,
} from './tailwind/fragments.mjs'
import { installationPages } from './tailwind/installation.mjs'

const SOURCE = 'tailwind'
const SITE = 'https://tailwindcss.com'
const NAV_FILE = 'src/app/(docs)/docs/index.tsx'
const DOCS_DIR = 'src/docs'
const DOCS_PREFIX = '/docs/'
const LIVE_PREVIEW = '> Live preview.'
const MULTI_CURSOR_CODE = 'src/components/multi-cursor/example.tsx'

const TYPE_BY_GROUP = { 'Getting started': 'guide', 'Core concepts': 'concept', 'Base styles': 'concept' }
const TYPE_BY_SLUG = {
  installation: 'install',
  'editor-setup': 'guide',
  compatibility: 'guide',
  'upgrade-guide': 'migration',
  'dark-mode': 'guide',
  theme: 'theming',
  colors: 'theming',
  'adding-custom-styles': 'guide',
  'detecting-classes-in-source-files': 'guide',
  'functions-and-directives': 'api-reference',
  preflight: 'concept',
}

/** Nav module, with its TypeScript types stripped and no external imports. */
async function loadNav(file) {
  const js = stripTypeScriptTypes(readFileSync(file, 'utf8'))
  return import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)
}

/** Every nav entry in order, parents before their children. */
function navRows(nav) {
  const rows = []
  const walk = (items, group, parent) => {
    for (const [title, href, children] of items) {
      const section = parent ? `${group} / ${parent}` : group
      rows.push({ title, href, group, section })
      if (Array.isArray(children)) walk(children, group, title)
    }
  }
  for (const [group, items] of Object.entries(nav)) walk(items, group, '')
  return rows
}

function typeOf(slug, group) {
  return TYPE_BY_SLUG[slug] ?? TYPE_BY_GROUP[group] ?? 'api-reference'
}

/** Renders each demo file once per page: the first use inlines its source, later uses add nothing. */
const inlinedByPage = new Map()
function inlineDemoOnce(ctx, key, rel, lang, note) {
  const done = inlinedByPage.get(ctx.file) ?? new Set()
  inlinedByPage.set(ctx.file, done)
  if (done.has(key)) return ''
  done.add(key)
  const source = ctx.readImport(join(ctx.root, rel))
  if (source == null) return null
  return [note, codeFence(lang, source.replace(/\n$/, ''))].filter(Boolean).join('\n\n')
}

/** A callout-style note from a tip's text: the `{<>...</>}` wrappers and template quotes are markup. */
function tipLine(label, props, children) {
  const raw = children || (typeof props.children === 'string' ? props.children : '')
  const text = raw
    .replace(/\{\s*<>|<\/>\s*\}|<\/?>/g, '')
    .replace(/\{\s*(['"])([^'"]*)\1\s*\}/g, '$2')
    .replace(/^`|`$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return text ? `> **${label}:** ${text}` : null
}

const passThrough = (props, children) => children

/**
 * Hooks for the site's custom JSX. `Example` is a live preview whose markup is
 * not text, so only the demo sources inlined inside it survive; the code that
 * the docs show is the fenced block that follows each `Figure`.
 */
/** Props the MDX pre-pass stored as base64 JSON in `data-props` (see markup.mjs). */
function fragmentProps(props) {
  return JSON.parse(Buffer.from(String(props['data-props'] ?? ''), 'base64').toString('utf8'))
}

export const components = {
  UsingACustomValue(props, children) {
    return usingACustomValue(fragmentProps(props), children)
  },

  ResponsiveDesign(props, children, ctx) {
    return responsiveDesign(fragmentProps(props), children, ctx.siteUrl)
  },

  TargetingSpecificStates(props, children, ctx) {
    return targetingSpecificStates(fragmentProps(props), children, ctx.siteUrl)
  },

  CustomizingYourTheme(props, children, ctx) {
    return customizingYourTheme(fragmentProps(props), children, ctx.siteUrl)
  },

  CustomizingYourSpacingScale(props, children, ctx) {
    return customizingYourSpacingScale(fragmentProps(props), ctx.siteUrl)
  },

  CustomizingYourThemeColors(props, children, ctx) {
    return customizingYourThemeColors(fragmentProps(props), ctx.siteUrl)
  },

  Figure(props, children) {
    const hints = ['hint', 'desktopHint'].map(key => props[key]).filter(value => typeof value === 'string' && value.trim())
    return [...hints.map(hint => `> ${hint}`), ...(hints.length ? [''] : []), children].join('\n')
  },

  Example(props, children) {
    const demos = fencedBlocks(children)
    return [LIVE_PREVIEW, ...demos.flatMap(lines => ['', ...lines])].join('\n')
  },

  Iframe() {
    return LIVE_PREVIEW
  },

  Stripes() {
    return ''
  },

  CodeExampleStack: passThrough,
  CodeExampleWrapper: passThrough,
  MultiCursorAnimation: passThrough,

  CodeExampleGroup(props, children) {
    const labels = stringList(props.filenames)
    let index = 0
    return splitBlocks(children)
      .flatMap(part => {
        if (!part.fenced) return part.lines
        const label = labels[index++]
        return label ? [`**${label}**`, '', ...part.lines, ''] : [...part.lines, '']
      })
      .join('\n')
  },

  TipGood(props, children) {
    return tipLine('Good', props, children)
  },

  TipBad(props, children) {
    return tipLine('Bad', props, children)
  },

  TipInfo(props, children) {
    return tipLine('Info', props, children)
  },

  ColorPalette(props, children, ctx) {
    return inlineDemoOnce(ctx, 'color-palette', 'src/components/color-palette.tsx', 'tsx', LIVE_PREVIEW)
  },

  DynamicViewportExample(props, children, ctx) {
    return inlineDemoOnce(ctx, 'dynamic-viewport', 'src/components/dynamic-viewport-example.tsx', 'tsx', '')
  },

  MultiCursorPreview(props, children, ctx) {
    return inlineDemoOnce(ctx, 'multi-cursor-animation', 'src/components/multi-cursor/animation.tsx', 'tsx', LIVE_PREVIEW)
  },

  MultiCursorCode(props, children, ctx) {
    const source = ctx.readImport(join(ctx.root, MULTI_CURSOR_CODE))
    const snippet = source == null ? null : templateBody(source, 'html')
    return snippet ? codeFence('html', snippet) : null
  },
}

export default {
  source: SOURCE,

  async collect({ vendorDir, entry }) {
    const root = join(vendorDir, SOURCE)
    const nav = (await loadNav(join(root, NAV_FILE))).default
    const report = []
    const pages = []
    const absent = []
    let titleDiffers = 0

    for (const row of navRows(nav)) {
      const slug = row.href.slice(DOCS_PREFIX.length)
      if (slug === 'installation') {
        // The Installation entry opens the live tab set: its pages are TSX, read as text.
        const installed = installationPages(root, { siteUrl: SITE })
        pages.push(...installed.pages)
        report.push(...installed.report)
        continue
      }
      const file = join(root, DOCS_DIR, `${slug}.mdx`)
      if (!existsSync(file)) {
        absent.push(`${row.title} (${row.href})`)
        continue
      }
      const cleaned = cleanMdx(readFileSync(file, 'utf8'))
      if (cleaned.title && cleaned.title !== row.title) titleDiffers++
      pages.push({
        slug,
        title: row.title,
        description: cleaned.description ?? '',
        url: `${SITE}${row.href}`,
        section: row.section,
        type: typeOf(slug, row.group),
        path: `vendor/docs/${SOURCE}/${DOCS_DIR}/${slug}.mdx`,
        file,
        format: 'mdx',
        text: cleaned.text,
      })
    }

    const mdxPages = pages.filter(page => page.format === 'mdx').length
    report.push(
      `nav: ${mdxPages} MDX pages from the docs nav; blog posts (src/blog) and the brand page are outside the nav and are excluded`
    )
    report.push(`nav entries with no MDX in the clone (not included): ${absent.join(' | ') || 'none'}`)
    report.push(`nav titles kept where the MDX export title differs: ${titleDiffers} pages`)

    return { root, siteUrl: SITE, pages, report }
  },
}
