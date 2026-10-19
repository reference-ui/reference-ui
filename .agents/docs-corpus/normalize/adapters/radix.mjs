/**
 * Radix adapter: the Themes, Primitives and Colors docs of the radix-ui/website
 * clone. The page list, titles, sections and order come from the three docs
 * nav configs (utils/themesRoutes.ts, primitivesRoutes.ts, colorsRoutes.ts);
 * the live docs sidebars list the same 121 pages. Bodies are read from
 * data/<slug>.mdx. Props data and code strings are lifted by
 * radix/jsx.mjs before the runner converts the page, and the component
 * hooks below render them. Demos come from components/demos. ThemesPropsTable
 * tables are read as text from the radix-ui/themes source clone (themes-src) by
 * radix/themes-props.mjs; a name it cannot resolve stays a note.
 *
 * Not docs, so excluded: the 15 case studies (the live site links them only
 * from its header's Case studies index, not from a docs page or the nav), and
 * the interactive pages /colors/custom and /themes/playground (no MDX in the clone).
 * Included outside the nav: blog/themes-3, which the live Themes Releases page links.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { stripTypeScriptTypes } from 'node:module'
import { parseFrontmatter } from '../lib/frontmatter.mjs'
import {
  JsxEl,
  JsxExpr,
  absoluteUrl,
  codeSpan,
  convertBody,
  nodesMarkdown,
  ReadError,
  valueMarkdown,
} from './radix/jsx.mjs'
import { propsTableFor } from './radix/themes-props.mjs'

const SOURCE = 'radix'
const SITE = 'https://www.radix-ui.com'
const TABS = [
  { key: 'themes', title: 'Themes', routes: 'utils/themesRoutes.ts', exportName: 'themesRoutes' },
  { key: 'primitives', title: 'Primitives', routes: 'utils/primitivesRoutes.ts', exportName: 'primitivesRoutes' },
  { key: 'colors', title: 'Colors', routes: 'utils/colorsRoutes.ts', exportName: 'colorsRoutes' },
]
const BLOG_SLUG = 'blog/themes-3'

const TYPE_BY_SLUG = {
  'primitives/docs/overview/introduction': 'concept',
  'primitives/docs/overview/getting-started': 'install',
  'primitives/docs/overview/accessibility': 'concept',
  'primitives/docs/overview/releases': 'changelog',
  'themes/docs/overview/getting-started': 'install',
  'themes/docs/overview/layout': 'concept',
  'themes/docs/overview/releases': 'changelog',
  'themes/docs/overview/resources': 'other',
  'colors/docs/overview/installation': 'install',
  'colors/docs/overview/releases': 'changelog',
  'colors/docs/palette-composition/scales': 'concept',
  'colors/docs/palette-composition/understanding-the-scale': 'concept',
}
const TYPE_BY_GROUP = {
  primitives: { Overview: 'guide', Guides: 'guide', Components: 'component', Utilities: 'component' },
  themes: { Overview: 'guide', Theme: 'theming', Layout: 'component', Typography: 'component', Components: 'component', Utilities: 'component' },
  colors: { Overview: 'guide', 'Palette composition': 'guide' },
}

/**
 * Components that only lay out or wrap their children: the children's Markdown
 * is the output. Live examples are the Themes and Colors previews the clone
 * cannot render, so each becomes a note that names it.
 */
const PASSTHROUGH = [
  'Box', 'Flex', 'Grid', 'Container', 'Section', 'Inset', 'Text', 'Button', 'IconButton', 'MenuItemButton',
  'Badge', 'Spinner', 'Reset', 'Theme', 'ThemeProvider', 'HeroQuote',
  'RadioCards.Root', 'RadioCards.Item', 'CheckboxCards.Root', 'CheckboxCards.Item',
]
const LIVE_EXAMPLES = [
  'ColorGrayPairs', 'ColorGrayPairsComplementary', 'ColorGrays', 'ColorScale01', 'ColorScale02', 'ColorScale03',
  'ColorScale04', 'ColorScale05', 'ThemeGraySwatches', 'ThemePanel', 'ThemesAccentSwatches', 'ThemesAllColors',
  'ThemesBlogPostExampleArea', 'ThemesBlogPostExampleDataList', 'ThemesBlogPostExampleProgress',
  'ThemesBlogPostExampleSegmentedControl', 'ThemesBlogPostExampleSegmentedControlAnimated',
  'ThemesBlogPostExampleSkeleton', 'ThemesBlogPostExampleSpinner', 'ThemesBlogPostExampleTabNav',
  'ThemesBoxExample', 'ThemesBreakpointsTable', 'ThemesColorScale', 'ThemesContainerExample',
  'ThemesDarkModeExample', 'ThemesFlexExample', 'ThemesFontFamilyTable', 'ThemesFontSizeScale',
  'ThemesFontSizeTable', 'ThemesFontWeightTable', 'ThemesGridExample', 'ThemesPanelCardExample',
  'ThemesPanelComposition', 'ThemesRadiusExample', 'ThemesRadiusScale', 'ThemesScalingExample',
  'ThemesSectionExample', 'ThemesShadowScale', 'ThemesSpacingScale', 'ThemesSpacingTable', 'ThemesTypeSpecimen',
  'ThemesUnofficialFigmaLibrary', 'ThemesUnofficialTailwindPlugin', 'ThemesVariantsExample',
  'ThemesVolumeControlExample', 'ThemesZIndexExample', 'UseCasesTable',
]

/** Per-run state. The runner reads the `components` object this module exports, so collect() fills in the demo hooks. */
const state = { pages: new Map(), demos: new Map() }

const quote = body => body.split('\n').map(line => (line.trim() ? `> ${line}` : '>')).join('\n')

function calloutMarkdown(kind, body) {
  const lines = body.replace(/^\n+|\n+$/g, '').split('\n')
  const first = lines.find(line => line.trim() !== '')
  if (first !== undefined && lines[0] === first && !/^(```|[-*]\s|#|\||>|<)/.test(first.trim())) {
    return [`> **${kind}:** ${first}`, ...lines.slice(1).map(line => (line.trim() ? `> ${line}` : '>'))].join('\n')
  }
  return [`> **${kind}:**`, '>', ...lines.map(line => (line.trim() ? `> ${line}` : '>'))].join('\n')
}

function fenced(lang, body) {
  const text = body.replace(/\n+$/, '')
  const longest = Math.max(0, ...[...text.matchAll(/`+/g)].map(m => m[0].length))
  const fence = '`'.repeat(Math.max(3, longest + 1))
  return [`${fence}${lang}`, text, fence].join('\n')
}

const LANG_BY_EXT = { '.jsx': 'jsx', '.tsx': 'tsx', '.js': 'js', '.ts': 'ts', '.css': 'css' }
const extOf = name => name.slice(name.lastIndexOf('.'))

/** Reads a lifted value back. The hook's file is the page file the value was lifted from. */
function lifted(ctx, token) {
  const info = state.pages.get(ctx.file)
  const index = Number(String(token ?? '').replace(/^#/, ''))
  if (!info || !Number.isInteger(index) || index < 0 || index >= info.values.length) {
    throw new Error(`no lifted value ${token}`)
  }
  return info.values[index]
}

/** The page's live URL and site, for resolving links inside hook output. */
function pageCtx(ctx) {
  const info = state.pages.get(ctx.file)
  return { pageUrl: info.url, siteUrl: SITE, values: info.values }
}

function mdTable(headers, rows) {
  if (headers.length === 0) return ''
  const line = cells => `| ${cells.join(' | ')} |`
  const fit = row => Array.from({ length: headers.length }, (_, i) => row[i] ?? '')
  return [line(headers), line(headers.map(() => '---')), ...rows.map(row => line(fit(row)))].join('\n')
}

/** Table cell text: one line, pipes escaped. */
function cell(value, pctx) {
  const text = typeof value === 'string' ? value : valueMarkdown(value, pctx)
  return text.replace(/\s*\n\s*/g, ' ').replace(/ {2,}/g, ' ').replace(/\|/g, '\\|').trim()
}

const code = value => (value === undefined ? '' : codeSpan(String(value)))
const yesNo = value => (value === true ? 'Yes' : value === false ? 'No' : '')

/** Each row must be a plain object with only the keys the table reads: anything else fails the run. */
function rowList(value, allowed, component) {
  if (!Array.isArray(value)) throw new ReadError(`${component} data is not an array`)
  return value.map(row => {
    if (!row || typeof row !== 'object' || row instanceof JsxEl) throw new ReadError(`${component} row is not an object`)
    for (const key of Object.keys(row)) {
      if (!allowed.includes(key)) throw new ReadError(`${component} row has unexpected key ${key}`)
    }
    return row
  })
}

/** Columns that appear only when some row fills them (an optional Description, for one). */
function rowsTable(rows, columns) {
  const used = columns.filter(col => !col.optional || rows.some(row => row[col.key] !== undefined))
  return mdTable(
    used.map(col => col.head),
    rows.map(row => used.map(col => col.render(row)))
  )
}

function propsTable(rows, ctx) {
  const pctx = pageCtx(ctx)
  const list = rowList(rows, ['name', 'required', 'type', 'typeSimple', 'default', 'description'], 'PropsTable')
  return mdTable(
    ['Name', 'Type', 'Default', 'Required', 'Description'],
    list.map(row => [
      cell(code(row.name), pctx),
      cell(code(row.type), pctx),
      cell(code(row.default), pctx),
      yesNo(row.required),
      cell(row.description ?? '', pctx),
    ])
  )
}

function keysText(keys) {
  if (!Array.isArray(keys)) throw new ReadError('KeyboardTable keys is not an array')
  return keys.map(key => codeSpan(String(key))).join(' + ')
}

/** Table.Root: the header row, then body rows, read from the lifted JSX tree. */
function tableOf(root, ctx) {
  const pctx = pageCtx(ctx)
  const rowsIn = section => {
    const out = []
    for (const row of section.children) {
      if (!(row instanceof JsxEl) || row.name !== 'Table.Row') continue
      out.push(row.children.filter(c => c instanceof JsxEl).map(c => nodesMarkdown(c.children, pctx).trim()))
    }
    return out
  }
  const header = []
  const body = []
  for (const section of root.children) {
    if (!(section instanceof JsxEl)) continue
    if (section.name === 'Table.Header') header.push(...rowsIn(section))
    else if (section.name === 'Table.Body') body.push(...rowsIn(section))
    else if (section.name === 'Table.Row') body.push(...rowsIn({ children: [section] }))
  }
  const head = header.length ? header.shift() : body.shift() ?? []
  return mdTable(head.map(text => cell(text, pctx)), [...header, ...body].map(row => row.map(text => cell(text, pctx))))
}

/** A demo's source: its index file, and for a code block also its styles, from components/demos/<folder>/<variant>. */
function demoFiles(ctx, folder, variant, { styles }) {
  const dir = join(ctx.root, 'components', 'demos', folder, variant)
  if (!existsSync(dir)) return null
  const names = readdirSync(dir).sort()
  const index = names.find(name => /^index\.(jsx|tsx|js|ts)$/.test(name))
  if (!index) return null
  const extra = styles ? names.filter(name => /^styles.*\.css$/.test(name)) : []
  return [index, ...extra]
    .map(name => {
      const body = ctx.readImport(join(dir, name))
      if (body == null) throw new Error(`cannot read components/demos/${folder}/${variant}/${name}`)
      return `**${variant}/${name}**\n\n${fenced(LANG_BY_EXT[extOf(name)] ?? '', body)}`
    })
    .join('\n\n')
}

const kebab = name => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

function demoHook(folder) {
  return (props, children, ctx) => {
    const files = demoFiles(ctx, folder, 'css-modules', { styles: false })
    return files
  }
}

/** The lead paragraph repeats the page description the runner already prints under the title. */
const sameText = (a, b) => {
  const norm = s => String(s ?? '').replace(/[`*]/g, '').replace(/\s+/g, ' ').trim()
  return norm(a) !== '' && norm(a) === norm(b)
}

const liveNote = name => `> Live example: ${name}. The site renders it from code outside this clone.`

/** The radix-ui/themes source clone (manifest extras), where the ThemesPropsTable defs are read from. */
const themesSourceDir = root => join(root, 'themes-src', 'packages', 'radix-ui-themes', 'src')

const components = {
  Description(props, children, ctx) {
    const info = state.pages.get(ctx.file)
    return sameText(children, info?.description) ? '' : children
  },
  HeroContainer: (props, children) => children,
  HeroCodeBlock(props, children, ctx) {
    return demoFiles(ctx, kebab(String(props.folder ?? '')), typeof props.cssLib === 'string' ? props.cssLib : 'css', {
      styles: true,
    })
  },
  Highlights: (props, children, ctx) => lifted(ctx, props.features).map(feature => `- ${feature}`).join('\n'),
  PropsTable: (props, children, ctx) => propsTable(lifted(ctx, props.data), ctx),
  DataAttributesTable(props, children, ctx) {
    const pctx = pageCtx(ctx)
    const rows = rowList(lifted(ctx, props.data), ['attribute', 'values', 'description'], 'DataAttributesTable')
    return rowsTable(rows, [
      { key: 'attribute', head: 'Attribute', render: row => code(row.attribute) },
      {
        key: 'values',
        head: 'Values',
        render: row => (Array.isArray(row.values) ? row.values.map(v => code(v)).join(', ') : ''),
      },
      { key: 'description', head: 'Description', optional: true, render: row => cell(row.description ?? '', pctx) },
    ])
  },
  KeyboardTable(props, children, ctx) {
    const pctx = pageCtx(ctx)
    const rows = rowList(lifted(ctx, props.data), ['keys', 'description'], 'KeyboardTable')
    return rowsTable(rows, [
      { key: 'keys', head: 'Keys', render: row => keysText(row.keys) },
      { key: 'description', head: 'Description', render: row => cell(row.description ?? '', pctx) },
    ])
  },
  CssVariablesTable(props, children, ctx) {
    const pctx = pageCtx(ctx)
    const rows = rowList(lifted(ctx, props.data), ['cssVariable', 'description'], 'CssVariablesTable')
    return rowsTable(rows, [
      { key: 'cssVariable', head: 'CSS variable', render: row => code(row.cssVariable) },
      { key: 'description', head: 'Description', render: row => cell(row.description ?? '', pctx) },
    ])
  },
  ThemesPropsTable(props, children, ctx) {
    const table = propsTableFor(themesSourceDir(ctx.root), String(props.defs ?? ''))
    if (table.markdown) return table.markdown
    return `> Props table: the props defined as \`${props.defs}\`. The props index of the radix-ui/themes source in this clone does not export it, so no table is rendered.`
  },
  PackageRelease: props => `### ${props.name} ${props.version}`,
  Note: (props, children) => calloutMarkdown('Note', children),
  'Callout.Root': (props, children) => (children ? quote(children) : ''),
  'Callout.Text': (props, children) => children,
  'Callout.Icon': () => '',
  'Tabs.Root': (props, children) => children,
  'Tabs.List': () => '',
  'Tabs.Trigger': () => '',
  'Tabs.Content': (props, children, ctx) => {
    const label = props.label === undefined ? props.value : lifted(ctx, props.label)
    return `**${label}**\n\n${children}`
  },
  'CodeBlock.Root': (props, children) => children,
  'CodeBlock.Header': () => '',
  'CodeBlock.Content': (props, children) => children,
  'CodeBlock.Pre': (props, children) => children,
  'CodeBlock.CopyButton': () => '',
  'CodeBlock.Code': (props, children, ctx) => fenced(String(props.language ?? ''), lifted(ctx, props.code)),
  'Table.Root': (props, children, ctx) => tableOf(lifted(ctx, props.rows), ctx),
  ThemesLinkCard: (props, children, ctx) =>
    `- [${props.title}](${absoluteUrl(String(props.href), pageCtx(ctx))}): ${props.desc}`,
  ColorScaleGroup: (props, children) => children,
  ColorScale: props => `- ${props.label} (\`${props.name}\`)`,
  Separator: () => '',
}
for (const name of PASSTHROUGH) components[name] = (props, children) => children
for (const name of LIVE_EXAMPLES) components[name] = (props, children) => [liveNote(name), children].filter(Boolean).join('\n\n')

export { components }

async function loadRoutes(file, exportName) {
  const js = stripTypeScriptTypes(readFileSync(file, 'utf8'))
  const mod = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)
  if (!Array.isArray(mod[exportName])) throw new Error(`${file}: no ${exportName} array`)
  return mod[exportName]
}

/** Demo registry: components/demos/index.jsx maps each <XDemo /> to its folder (the css-modules variant). */
function demoRegistry(root) {
  const text = readFileSync(join(root, 'components', 'demos', 'index.jsx'), 'utf8')
  const map = new Map()
  for (const m of text.matchAll(/export\s*\{\s*default as (\w+)\s*\}\s*from\s*["']\.\/([\w-]+)\/css-modules["']/g)) {
    map.set(m[1], m[2])
  }
  return map
}

function typeOf(slug, tabKey, group) {
  return TYPE_BY_SLUG[slug] ?? TYPE_BY_GROUP[tabKey]?.[group] ?? 'other'
}

function buildPage({ root, route, tab, group, stats }) {
  const slug = route.slug
  const file = join(root, 'data', `${slug}.mdx`)
  if (!existsSync(file)) throw new Error(`${slug}: no MDX file in the clone`)
  const { data, body } = parseFrontmatter(readFileSync(file, 'utf8'))
  const url = `${SITE}/${slug}`
  const values = []
  let text
  try {
    text = convertBody(body, { pageUrl: url, siteUrl: SITE, values, tabLabels: new Map() }, stats)
  } catch (err) {
    throw new Error(`${file}: ${err.message}`)
  }
  state.pages.set(file, { url, values, description: data.metaDescription ?? '' })
  return {
    slug,
    title: route.title,
    description: data.metaDescription ?? '',
    url,
    section: `${tab.title} / ${group.label}`,
    type: typeOf(slug, tab.key, group.label),
    path: `vendor/docs/${SOURCE}/data/${slug}.mdx`,
    file,
    format: 'mdx',
    text,
  }
}

function buildBlog(root, stats) {
  const file = join(root, 'data', `${BLOG_SLUG}.mdx`)
  const { data, body } = parseFrontmatter(readFileSync(file, 'utf8'))
  const url = `${SITE}/${BLOG_SLUG}`
  const values = []
  const text = convertBody(body, { pageUrl: url, siteUrl: SITE, values, tabLabels: new Map() }, stats)
  state.pages.set(file, { url, values })
  return {
    slug: BLOG_SLUG,
    title: data.metaTitle,
    description: data.metaDescription ?? '',
    url,
    section: 'Blog',
    type: 'blog',
    path: `vendor/docs/${SOURCE}/data/${BLOG_SLUG}.mdx`,
    file,
    format: 'mdx',
    text,
  }
}

export default {
  source: SOURCE,

  async collect({ vendorDir, entry }) {
    const root = join(vendorDir, SOURCE)
    state.pages = new Map()
    state.demos = demoRegistry(root)
    for (const [name, folder] of state.demos) components[name] = demoHook(folder)

    const stats = { unwrapped: 0 }
    const report = []
    const pages = []
    const counts = []
    for (const tab of TABS) {
      const groups = await loadRoutes(join(root, tab.routes), tab.exportName)
      let count = 0
      for (const group of groups) {
        for (const route of group.pages) {
          if (route.draft === true) continue
          pages.push(buildPage({ root, route, tab, group, stats }))
          count++
        }
      }
      counts.push(`${tab.title} ${count}`)
    }
    pages.push(buildBlog(root, stats))

    const caseStudies = readdirSync(join(root, 'data', 'primitives', 'case-studies')).filter(n => n.endsWith('.mdx')).length
    report.push(`nav: ${pages.length - 1} pages (${counts.join(', ')}), in nav order; plus ${BLOG_SLUG} (type blog, linked from the live Themes Releases page)`)
    report.push(`excluded: ${caseStudies} case studies (primitives/case-studies): linked only from the site header's Case studies index`)
    report.push('excluded: /colors/custom and /themes/playground (interactive pages, no MDX in the clone)')
    report.push(`MDX wrapper braces removed: ${stats.unwrapped}; lifted values: ${[...state.pages.values()].reduce((n, p) => n + p.values.length, 0)}`)
    const props = { rendered: 0, notes: [] }
    const srcDir = themesSourceDir(root)
    for (const page of pages) {
      for (const m of page.text.matchAll(/<ThemesPropsTable defs="([^"]+)"/g)) {
        if (propsTableFor(srcDir, m[1]).markdown) props.rendered++
        else props.notes.push(m[1])
      }
    }
    const noteNames = [...new Set(props.notes)].join(', ') || 'none'
    report.push(`ThemesPropsTable: ${props.rendered} rendered as tables, ${props.notes.length} left as notes (${noteNames}); live-example notes name the component`)
    return { root, siteUrl: SITE, pages, report }
  },
}
