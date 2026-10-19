/**
 * Component hooks for mantine.dev's custom JSX. Where the clone holds the text
 * (demo source, styles-API data, the literal rows a table is given, the
 * command an install block is given), the hook renders exactly that. Where the
 * site builds the text from component code the clone does not have, the hook
 * writes one line that names the component and its props, and invents no
 * content. Those lines are counted in the report.
 */

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { cell, parseLiteral, Unsupported } from './literal.mjs'
import { demoMarkdown, fenced, modifiersTable, readDemo, readStylesApi, selectorsTable, variablesTable } from './demos.mjs'
import { readClone, resolveExpression, specOf } from './modules.mjs'
import { liftedElement } from './elements.mjs'

const SITE_BUILT = 'the site builds this from its component code, which this clone does not include'

/** One line that names the element and its props, with the reason its text is not here. */
function note(name, props, reason = SITE_BUILT) {
  const attrs = Object.entries(props ?? {})
    .map(([key, value]) => (value === true ? key : `${key}=${String(value).replace(/\s+/g, ' ')}`))
    .join(' ')
  return `> ${name}${attrs ? ` (${attrs})` : ''}: ${reason}.`
}

/** The site's own links are root-relative; the corpus keeps them absolute. */
function absolute(href, siteUrl) {
  return typeof href === 'string' && href.startsWith('/') ? `${siteUrl}${href}` : href
}

/** Demo: the `code` of the exported demo the page's `data` expression names. */
function Demo(props, children, ctx) {
  const expr = typeof props.data === 'string' ? props.data : ''
  const ref = expr ? resolveExpression(ctx.root, ctx.file, expr) : null
  if (!ref || ref.rest.length) return note('Demo', props, 'its data is not an export this clone holds')
  try {
    return demoMarkdown(readDemo(ctx.root, ref.file, ref.name))
  } catch (err) {
    if (!(err instanceof Unsupported)) throw err
    if (/has no code$/.test(err.message)) return note('Demo', props, 'the example has no source code in this clone (a preview only)')
    return note('Demo', props, `its source is not readable here (${err.message})`)
  }
}

/** The Styles API data file for a component, or null. */
function stylesFileFor(ctx, component) {
  const file = join(ctx.root, 'packages', '@docs', 'styles-api', 'src', 'data', `${component}.styles-api.ts`)
  return existsSync(file) ? file : null
}

/** Name of the component's `...StylesApi` export in its data file. */
function stylesNameFor(file, component) {
  const names = [...readClone(file).matchAll(/export const (\w+StylesApi)\b/g)].map(m => m[1])
  return names.includes(`${component}StylesApi`) ? `${component}StylesApi` : names[0]
}

/** The selectors of the component's Styles API, as a table. */
function StylesApiSelectors(props, children, ctx) {
  const file = typeof props.component === 'string' ? stylesFileFor(ctx, props.component) : null
  if (!file) return note('StylesApiSelectors', props)
  const table = selectorsTable(readStylesApi(ctx.root, file, stylesNameFor(file, props.component)))
  return table ?? note('StylesApiSelectors', props, 'the component has no selectors in its Styles API data')
}

/** A `data={...StylesApi}` identifier, resolved to its Styles API object. */
function stylesDataOf(props, ctx) {
  const ref = typeof props.data === 'string' ? resolveExpression(ctx.root, ctx.file, props.data) : null
  if (!ref || ref.rest.length) return null
  return readStylesApi(ctx.root, ref.file, ref.name)
}

function SelectorsTable(props, children, ctx) {
  const data = stylesDataOf(props, ctx)
  return (data && selectorsTable(data)) ?? note('SelectorsTable', props)
}

function ModifiersTable(props, children, ctx) {
  const data = stylesDataOf(props, ctx)
  return (data && modifiersTable(data)) ?? note('ModifiersTable', props)
}

function VariablesTable(props, children, ctx) {
  const data = stylesDataOf(props, ctx)
  return (data && variablesTable(data)) ?? note('VariablesTable', props)
}

/** A table from literal rows: header cells, then one line per row. */
function tableOf(head, rows) {
  const width = head.length
  const line = cells => `| ${cells.map(cell).join(' | ')} |`
  return [line(head), line(Array(width).fill('---')), ...rows.map(row => line(row))].join('\n')
}

function KeyboardEventsTable(props) {
  const rows = parseLiteral(props.data)
  if (!Array.isArray(rows)) return note('KeyboardEventsTable', props)
  return tableOf(['Key', 'Description'], rows.map(r => [r.key, r.description]))
}

function DataTable(props) {
  const head = props.head === undefined ? [] : parseLiteral(props.head)
  const rows = parseLiteral(props.data)
  if (!Array.isArray(head) || !Array.isArray(rows) || rows.some(r => !Array.isArray(r))) {
    return note('DataTable', props)
  }
  return tableOf(head.length ? head : Array(rows[0]?.length ?? 0).fill(''), rows)
}

function CssVariablesGroup(props) {
  const rows = parseLiteral(props.data)
  if (!Array.isArray(rows)) return note('CssVariablesGroup', props)
  const hasDescription = rows.some(r => r.description !== undefined)
  const head = hasDescription ? ['Variable', 'Description', 'Default value'] : ['Variable', 'Default value']
  const width = head.length
  // A `{ group }` row is the table's heading for the rows after it.
  return tableOf(
    head,
    rows.map(r => {
      if (r.group !== undefined) return [`**${r.group}**`, ...Array(width - 1).fill('')]
      return hasDescription ? [r.variable, r.description ?? '', r.defaultValue ?? ''] : [r.variable, r.defaultValue ?? '']
    })
  )
}

/** The yarn command the install block shows (the site's SSR output); `dev` adds --dev. */
function InstallScript(props) {
  const packages = typeof props.packages === 'string' ? props.packages.trim() : ''
  if (!packages) return note('InstallScript', props)
  const dev = props.dev === true || props.dev === 'true' ? ' --dev' : ''
  return fenced('bash', `yarn add${dev} ${packages}`)
}

function NpmScript(props) {
  const parts = []
  if (typeof props.npmScript === 'string') parts.push(`**npm**\n\n${fenced('bash', props.npmScript)}`)
  if (typeof props.yarnScript === 'string') parts.push(`**yarn**\n\n${fenced('bash', props.yarnScript)}`)
  return parts.length ? parts.join('\n\n') : note('NpmScript', props)
}

function ExamplesButton(props, children, ctx) {
  if (typeof props.link !== 'string' || typeof props.label !== 'string') return note('ExamplesButton', props)
  return `[${props.label}](${absolute(props.link, ctx.siteUrl)})`
}

function LlmButton(props, children, ctx) {
  if (typeof props.href !== 'string') return note('LlmButton', props)
  return `[${props.href}](${absolute(props.href, ctx.siteUrl)})`
}

function Video(props, children, ctx) {
  if (typeof props.src !== 'string') return note('Video', props)
  return `[Video](${absolute(props.src, ctx.siteUrl)})`
}

/** An image imported in the page (`image.src`): the file name, since the image is not in the clone. */
function Image(props, children, ctx) {
  const imported = typeof props.src === 'string' ? props.src.match(/^([\w$]+)\.src$/) : null
  const spec = imported ? specOf(ctx.file, imported[1]) : null
  if (!spec) return note('Image', props, 'the image is not in this clone')
  return `> Image: ${spec.split('/').pop()}. The image file is not in this clone.`
}

function ErrorMessage(props) {
  if (typeof props.error !== 'string') return note('ErrorMessage', props)
  return fenced('text', props.error)
}

/** A link when it has an href; otherwise the button's text, as the example shows it. */
function Button(props, children, ctx) {
  const label = typeof props.children === 'string' ? props.children : children
  if (!label) return note('Button', props)
  if (typeof props.href === 'string') return `[${label}](${absolute(props.href, ctx.siteUrl)})`
  return label
}

/** Layout wrappers in the help examples: their content is what the reader sees. */
function Group(props, children) {
  return children
}

function Code(props, children) {
  return children ? `\`${children}\`` : note('Code', props)
}

/** Components whose text the site builds from code the clone does not have. */
const SITE_BUILT_COMPONENTS = [
  'AutoContrast',
  'ClearSectionMode',
  'ComboboxData',
  'ComboboxDisclaimer',
  'ComboboxFiltering',
  'ComboboxLargeData',
  'ComboboxProps',
  'CssFilesList',
  'CssVariablesList',
  'FlexboxGapSupport',
  'FrameworksGuides',
  'GetElementRef',
  'GetTemplates',
  'Gradient',
  'InputAccessibility',
  'InputFeatures',
  'InputSections',
  'LogoAssets',
  'PackagesInstallation',
  'Polymorphic',
  'ServerComponentsIncompatible',
  'SponsorButton',
  'StylePropsTable',
  'TargetComponent',
  'TemplatesList',
  'ThemeColors',
  'VersionsList',
  'WrapperProps',
]

/** A lifted element (see elements.mjs): its own props, read in full, go to its component's hook. */
function MantineElement(props, children, ctx) {
  const lifted = liftedElement(props.id)
  return components[lifted.name](lifted.props, children, ctx)
}

const HOOKS = {
  MantineElement,
  Demo,
  StylesApiSelectors,
  SelectorsTable,
  ModifiersTable,
  VariablesTable,
  KeyboardEventsTable,
  DataTable,
  CssVariablesGroup,
  InstallScript,
  NpmScript,
  ExamplesButton,
  LlmButton,
  Video,
  Image,
  ErrorMessage,
  Button,
  Group,
  Code,
  ...Object.fromEntries(SITE_BUILT_COMPONENTS.map(name => [name, props => note(name, props)])),
}

/** A literal the clone does not hold as plain data becomes a note, not a failed run. */
function guarded(name, hook) {
  return (props, children, ctx) => {
    try {
      return hook(props, children, ctx)
    } catch (err) {
      if (!(err instanceof Unsupported)) throw err
      return note(name, props, `its data is not plain literal data here (${err.message})`)
    }
  }
}

export const components = Object.fromEntries(Object.entries(HOOKS).map(([name, hook]) => [name, guarded(name, hook)]))

/**
 * Element names whose source the adapter lifts out of the page before conversion
 * (see elements.mjs). The children-bearing wrappers stay with the converter.
 */
export const LIFTED = Object.keys(components).filter(name => !['Group', 'Code', 'Button', 'MantineElement'].includes(name))
