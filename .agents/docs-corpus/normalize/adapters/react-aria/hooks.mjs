/**
 * Component hooks for the react-aria source (normalize/README.md, Component hooks). Kinds:
 *  - generated tables and content the clone does not hold: a one-line note saying what it is;
 *  - live demos, diagrams and icons with no text of their own: dropped (empty Markdown);
 *  - structure: steps, tabs, cards, alerts, headings and wrappers keep their text, labelled as the site labels them;
 *  - examples and app sources the clone holds: the source is inlined as a fenced block;
 *  - lists the site builds from the page registry (blog posts, release notes).
 */

import { join } from 'node:path'
import { stringList } from '../../lib/mdx.mjs'
import { absoluteHref, pageOf, registryPages } from './registry.mjs'
import { stringExport } from './source.mjs'

const TABLE_NOTE = 'The site generates this table from the TypeScript types, which the clone does not include.'

const LANG = { '.tsx': 'tsx', '.ts': 'ts', '.jsx': 'jsx', '.js': 'js', '.mjs': 'js', '.css': 'css', '.html': 'html', '.json': 'json' }

/** The last segment of a docs expression: `docs.exports.Button` is `Button`. */
function who(expression, fallback = 'the component') {
  const text = typeof expression === 'string' ? expression.replace(/^\{|\}$/g, '').trim() : ''
  const name = text.split('.').pop()
  return /^[A-Za-z_$][\w$]*$/.test(name) ? name : fallback // a call or other expression names nothing
}

const str = value => (typeof value === 'string' ? value : '')

const table = what => `> Table: ${what}. ${TABLE_NOTE}`

const note = text => `> ${text}`

/** Something the site builds at render time from data the clone does not hold. */
const generated = what => note(`Generated on the site: ${what} (not in the clone).`)

/** A fenced block; a longer fence when the code itself has a fence. */
function code(lang, body) {
  const text = body.replace(/\n$/, '')
  const fence = text.includes('```') ? '~~~~' : '```'
  return [`${fence}${lang}`, ...text.split('\n'), fence].join('\n')
}

function langOf(path) {
  const dot = path.lastIndexOf('.')
  return dot === -1 ? '' : LANG[path.slice(dot)] ?? ''
}

const trimBlock = text => text.replace(/^\n+|\n+$/g, '')

/** An InlineAlert: a blockquote labelled by its variant, and by its heading when it has one. */
function alertBlock(variant, children) {
  const kind = variant === 'negative' ? 'Warning' : 'Note'
  const lines = children.split('\n')
  const first = lines.findIndex(line => line.trim() !== '')
  let label = kind
  let body = lines
  if (first !== -1) {
    const heading = lines[first].match(/^\*\*(.+)\*\*$/)
    if (heading) {
      label = `${kind}: ${heading[1]}`
      body = lines.slice(first + 1)
    }
  }
  const quoted = trimBlock(body.join('\n'))
    .split('\n')
    .map(line => (line.trim() ? `> ${line}` : '>'))
  return [`> **${label}**`, '>', ...quoted].join('\n').replace(/\n>\n>$/, '')
}

/** Live demos, diagrams and visual pieces with no text of their own. */
const DROP = [
  'Button', 'ActionButton', 'ToggleButton', 'ToggleButtonGroup', 'ButtonGroup', 'ActionGroup', 'FileTrigger',
  'Checkbox', 'CheckboxGroup', 'ComboBox', 'ListBox', 'ListView', 'GridList', 'Menu', 'MenuTrigger', 'TableView',
  'Table', 'TagGroup', 'TreeView', 'Tree', 'Calendar', 'RangeCalendar', 'DatePicker', 'DateField', 'DateRangePicker',
  'TimeField', 'NumberField', 'SearchField', 'TextField', 'TextArea', 'Slider', 'RadioGroup', 'Switch', 'Select',
  'Picker', 'Popover', 'Dialog', 'DialogTrigger', 'Modal', 'Tooltip', 'TooltipTrigger', 'Toast', 'ProgressBar',
  'ProgressCircle', 'Meter', 'Avatar', 'Accordion', 'Breadcrumbs', 'Breadcrumb', 'DropZone', 'Separator', 'Toolbar',
  'SideNav', 'SideNavPanel', 'CardView', 'ColorArea', 'ColorField', 'ColorSlider', 'ColorSwatch', 'ColorSwatchPicker',
  'ColorWheel', 'ColorPicker', 'Autocomplete', 'SearchAutocomplete', 'Sheet', 'Virtualizer', 'Group', 'Form', 'Badge',
  'Draggable', 'DraggableListBox', 'DropTarget', 'DragPreview', 'DragAffordance', 'DragIntoList', 'DropOperation',
  'DragBetweenListsExample', 'ListBoxExample', 'FocusExample', 'SwitchAnimation', 'MouseAnimation', 'ExampleTree',
  'RootDropPosition', 'OnDropPosition', 'BetweenDropPosition', 'Counter', 'Anatomy', 'DialogAnatomy', 'ViewportDiagram',
  'SheetTimelineDemo', 'SnapPointsDiagram', 'PreventDismissalDiagram', 'StackingDiagram', 'SubmenuAnimation',
  'SubmenuSafeArea', 'SubmenuAtan2', 'SubmenuAtan2FromPointer', 'RTLTimefield', 'RTLActualPlaceholder',
  'ColorEditorExample', 'AIIconsPageSearch', 'IconsPageSearch', 'IconColors', 'IconSizes', 'IllustrationCards',
  'Hero', 'Image', 'Divider', 'Illustration', 'StatusLight', 'LabeledValue', 'IllustratedMessage', 'PreviewTrigger',
  'Routers', 'Outlet', 'Settings', 'Map', 'A11y', 'I18n', 'KanbanBoard', 'Styles', 'Window',
]

/** Icons and glyphs (inside tab labels and headings too): dropped; framework tiles are icons. */
const ICONS = [
  'ChevronRight', 'ChevronDown', 'ChevronLeft', 'ChevronsUpDownIcon', 'ArrowRight', 'ArrowLeft', 'Plus', 'Star', 'Bell',
  'Minus', 'Search', 'User', 'Cut', 'Paste', 'Copy', 'MoreHorizontal', 'Ellipsis', 'Pencil', 'Trash', 'Mail', 'Check',
  'CheckIcon', 'CheckmarkIcon', 'CalendarIcon', 'ErrorIcon', 'LeftIcon', 'RightIcon', 'Smartphone', 'Instagram',
  'Star1', 'FolderOpen', 'Pin', 'Upload', 'Arrow', 'PendingBadge', 'Nextjs', 'ReactRouter', 'Parcel', 'Webpack', 'Vite',
  'Rollup', 'ESBuild',
]

/** Transparent wrappers: the element's text is the text of its children. */
const WRAPPERS = [
  'View', 'Flex', 'Grid', 'Section', 'Scrollable', 'Provider', 'Text', 'Header', 'Footer', 'Figure', 'Step', 'StepList',
  'Tabs', 'TabList', 'TabPanel', 'TabPanels', 'Card', 'CardGroup', 'CardDescription', 'Disclosure', 'DisclosurePanel',
  'FunctionAPIGroup', 'React.Fragment', 'Fragment', 'SettingsContextProvider', 'ProviderWrapper', 'I18nProvider',
  'RACSettingsProvider', 'LocalizedStringProvider', 'ClientProvider', 'RouterProvider', 'SSRProvider',
  'TypeContext.Provider', 'ButtonContext.Provider', 'TextFieldContext.Provider', 'InputContext.Provider',
  'TextContext.Provider', 'UNSAFE_PortalProvider', 'SearchMenuWrapperServer', 'RouterWrapperServer', 'Router', 'Route', 'PaginatedCarousel', 'SearchMenuButton', 'ExampleSwitcher',
]

/** The pages a listing shows: the same section (or, for release lists, every Releases section of that site). */
function listingPages(page, { releases = false } = {}) {
  const site = page.section.split(' / ')[0]
  const section = releases ? `${site} / Releases` : page.section
  return registryPages().filter(
    other => other.section === section && other.file !== page.file && !other.file.endsWith('/index.mdx')
  )
}

/** Newest first when every page has a date, else highest slug first (v1-10-0 after v1-9-0, 2025 after 2024). */
function newestFirst(pages) {
  const dated = pages.map(page => ({ page, time: Date.parse(stringExport(page.text, 'date') ?? '') }))
  if (dated.length && dated.every(entry => !Number.isNaN(entry.time))) return dated.sort((a, b) => b.time - a.time).map(e => e.page)
  return [...pages].sort((a, b) => b.slug.localeCompare(a.slug, 'en', { numeric: true }))
}

function listOf(pages) {
  return pages.map(post => `- [${post.title}](${post.url})`).join('\n')
}

/** Starter directories that the page imports through its package aliases (vanilla-starter/Button and so on). */
const STARTER_DIR = { vanilla: 'starters/docs/src', tailwind: 'starters/tailwind/src', hooks: 'starters/hooks/src' }

/** The starter source files behind a demo's component, found through the page's own import of it. */
function starterFilesFor(ctx, componentExpression) {
  const name = str(componentExpression).replace(/^\{|\}$/g, '').trim()
  const source = ctx.readImport(ctx.file) ?? ''
  for (const match of source.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"](vanilla|tailwind|hooks)-starter\/([\w./-]+)['"]/g)) {
    const locals = match[1].split(',').map(item => item.trim().split(/\s+as\s+/).pop())
    if (!name || !locals.includes(name)) continue
    const base = `${STARTER_DIR[match[2]]}/${match[3]}`
    return [`${base}.tsx`, `${base}.css`].filter(path => ctx.readImport(join(ctx.root, path)) != null)
  }
  return []
}

const hooks = {
  // Generated API tables: the note names the thing the table describes.
  PropTable: p => table(`lists the props of ${who(p.component)}, with their types and descriptions`),
  GroupedPropTable: p => table(`lists the options of ${who(p.exportSpread ?? p.component)}, in groups`),
  InterfaceType: p => table(`lists the properties of ${who(p.exportSpread ?? p.type ?? p.interface)}`),
  ClassAPI: p => table(`lists the methods and properties of the ${who(p.class, 'component')} class`),
  FunctionAPI: p => table(`lists the parameters and return value of ${who(p.function)}`),
  FunctionJSDoc: p => table(`lists the documentation comment of ${who(p.function ?? p.component)}`),
  ComponentJSDoc: p => table(`lists the documentation comment of ${who(p.component)}`),
  StyleMacroProperties: () => table('lists the style macro properties and the values each accepts'),
  S2StyleProperties: () => table('lists the style properties and the values each accepts'),
  StaticTable: () => table('lists the values in this table'),
  Parameters: () => table('lists the parameters'),
  ReturnType: () => table('lists the return type'),
  PatternTestingFAQ: p => generated(`the FAQ for testing ${str(p.patternName) || 'this pattern'}`),
  StarterKits: () => generated('the list of starter kits'),
  ShadcnCommand: () => generated('the shadcn/ui install command'),
  HooksStarterKit: () => generated('the hooks starter kit example'),
  S2FAQ: () => generated('the styling FAQ'),
  Contributing: () => note("The contributing guide is the repository's CONTRIBUTING.md, which the clone does not include."),

  ExampleList: p => note(`The examples tagged "${str(p.tag)}" are listed on the site.`),
  ComponentList: p => {
    const names = stringList(p.components)
    return names.length ? note(`Components: ${names.join(', ')}.`) : ''
  },
  HeaderInfo: (p, _children, ctx) => {
    const pkg = (ctx.readImport(ctx.file) ?? '').match(/from ['"]([^'"]+)\/package\.json['"]/)
    const components = stringList(p.componentNames)
    const parts = [pkg ? `Package: \`${pkg[1]}\`.` : '', components.length ? `Components: ${components.join(', ')}.` : '']
    return note(parts.filter(Boolean).join(' '))
  },
  Command: p => code('sh', str(p.command)),
  InstallCommand: p => code('sh', ['npm install', str(p.pkg), str(p.flags)].filter(Boolean).join(' ')),
  Home: () => generated('the home page content, built by the Home component'),
  // The lead paragraph: kept unless the page's description already holds the same text.
  PageDescription: (_p, children, ctx) => {
    const text = children.trim()
    if (!text || text.includes('{') || pageOf(ctx.file)?.description === text) return ''
    return text
  },


  // Demos: the source is inlined where the clone has it.
  ExampleSwitcher: (_p, children) => children,
  VisualExample: (p, _children, ctx) => {
    const type = str(p.type)
    const label = { vanilla: 'Vanilla CSS', tailwind: 'Tailwind', s2: 'React Spectrum (S2)' }[type] ?? (type || 'Example')
    const paths = stringList(p.files).length ? stringList(p.files) : starterFilesFor(ctx, p.component)
    const blocks = paths.map(path => {
      const body = ctx.readImport(join(ctx.root, path))
      return body == null ? `*${path}: not readable from the clone.*` : `*${path}*\n\n${code(langOf(path), body)}`
    })
    if (!blocks.length) return note(`Live demo of ${who(p.component)} (${label}); no source file in the clone.`)
    return [`**${label}**`, '', ...blocks.flatMap(block => [block, ''])].join('\n').replace(/\n+$/, '')
  },
  ExampleApp: (p, _children, ctx) => {
    const dir = str(p.dir)
    const file = str(p.defaultSelected)
    const body = dir && file ? ctx.readImport(join(ctx.root, dir, file)) : null
    if (body == null) return note(`Example app${dir ? ` in ${dir}` : ''}: its source is not readable from the clone.`)
    return `*${dir}/${file}*\n\n${code(langOf(file), body)}`
  },
  ExampleCard: (p, _children, ctx) => {
    const href = absoluteHref(str(p.url), ctx.file)
    const head = href ? `[${str(p.title)}](${href})` : `**${str(p.title)}**`
    const description = str(p.description)
    return description ? `- ${head}: ${description}` : `- ${head}`
  },
  Highlights: p => {
    const items = [...str(p.items).matchAll(/title:\s*'([^']*)'[\s\S]*?description:\s*'([^']*)'/g)]
    return items.map(item => `- **${item[1]}**: ${item[2]}`).join('\n')
  },
  PostList: (_p, _children, ctx) => {
    const page = pageOf(ctx.file)
    return page ? listOf(newestFirst(listingPages(page))) : ''
  },
  PostListing: (_p, _children, ctx) => {
    const page = pageOf(ctx.file)
    return page ? listOf(newestFirst(listingPages(page, { releases: true }))) : ''
  },

  // Structure: text kept, labelled as the site labels it.
  InlineAlert: (p, children) => alertBlock(str(p.variant), children),
  Heading: (_p, children) => (children ? `**${children}**` : ''),
  Content: (_p, children) => children,
  Caption: (_p, children) => (children ? `*${children}*` : ''),
  CardTitle: (_p, children) => (children ? `**${children}**` : ''),
  Tab: (_p, children) => (children ? `**${children}**` : ''),
  DisclosureTitle: (_p, children) => (children ? `**${children}**` : ''),
  summary: (_p, children) => (children ? `**${children}**` : ''),
  Link: (p, children, ctx) => {
    const href = absoluteHref(str(p.href), ctx.file)
    return href ? `[${children || href}](${href})` : children
  },
  LearnMoreLink: (p, children, ctx) => {
    const href = absoluteHref(str(p.href), ctx.file)
    return href ? `[${children || 'Learn more'}](${href})` : children
  },
  ...Object.fromEntries(WRAPPERS.map(name => [name, (_p, children) => children])),
  ...Object.fromEntries(ICONS.map(name => [name, () => ''])),
  ...Object.fromEntries(DROP.map(name => [name, () => ''])),
}

export const components = hooks
