/**
 * Ark UI adapter, React variant (live at https://ark-ui.com/docs). Pages, titles,
 * sections and order come from the nav config (`website/src/lib/sidebar-config.ts`):
 * each nav item is one page, and its content is `website/src/content/pages/<group>/<id>.mdx`.
 * The changelog has no MDX in the clone, so its text is the `# Changelog` section of
 * `llms/llms-react.txt`, the React Markdown the site exports. That export also supplies
 * the blocks the site builds from data outside the clone: anatomy, context and keyboard
 * tables, the quickstart links and the install command. Blog posts are not in the docs
 * nav and are excluded, as is `license`, which the nav does not link.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { stripTypeScriptTypes } from 'node:module'
import { parseFrontmatter } from '../lib/frontmatter.mjs'
import { scanHeadings } from '../lib/sections.mjs'

const SOURCE = 'ark-ui'
const SITE = 'https://ark-ui.com'
const DOCS_PATH = '/docs/'
const REPO = 'vendor/docs/ark-ui/'
const NAV = 'website/src/lib/sidebar-config.ts'
const PAGES = 'website/src/content/pages'
const BLOG = 'website/src/content/blog'
const DEMOS = 'website/src/demos'
const TYPES = 'website/src/content/types/react'
const EXAMPLE_ROOTS = ['packages/react/src/components', 'packages/react/src/providers']
const LLMS_REACT = 'llms-react.txt'
const CHANGELOG_ID = 'changelog'

/** The folder under pages/ that each nav group lives in, and so the live URL segment. */
const FOLDER_BY_GROUP = {
  Overview: 'overview',
  Guides: 'guides',
  'AI for agents': 'ai',
  Collections: 'collections',
  Components: 'components',
  Utilities: 'utilities',
}

const TYPE_BY_ID = { 'getting-started': 'install', about: 'concept', changelog: 'changelog' }
const TYPE_BY_GROUP = {
  Guides: 'guide',
  'AI for agents': 'ai',
  Collections: 'concept',
  Components: 'component',
  Utilities: 'api-reference',
}

/** Progress pages keep their examples one level down, by variant. */
const PROGRESS_VARIANT = { 'progress-linear': 'linear', 'progress-circular': 'circular' }

/** Filled by collect(), read by the hooks in the same run. */
const pageByFile = new Map() // page file -> { id, title, text }
const titleById = new Map() // page id -> title
let llms = { lines: [], heads: [], pages: new Map() }

/** Nav module, with its TypeScript types stripped and no external imports. */
async function loadNav(file) {
  const js = stripTypeScriptTypes(readFileSync(file, 'utf8'))
  return import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)
}

/** llms-react.txt split at its H1 page headings. `# @…` package headings stay inside their page. */
function parseLlms(text) {
  const lines = text.split('\n')
  const heads = scanHeadings(lines)
  const pageHeads = heads.filter(h => h.level === 1 && !h.text.startsWith('@'))
  const pages = new Map()
  pageHeads.forEach((h, k) => {
    const end = k + 1 < pageHeads.length ? pageHeads[k + 1].index : lines.length
    if (!pages.has(h.text)) pages.set(h.text, { start: h.index + 1, end })
  })
  return { lines, heads, pages }
}

function trimBlank(lines) {
  let a = 0
  let b = lines.length
  while (a < b && lines[a].trim() === '') a++
  while (b > a && lines[b - 1].trim() === '') b--
  return lines.slice(a, b)
}

/** Each fenced block in a list of lines, as one string. */
function fencesIn(lines) {
  const out = []
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('```')) continue
    const close = lines.findIndex((line, j) => j > i && line.trim() === '```')
    if (close === -1) break
    out.push(lines.slice(i, close + 1).join('\n'))
    i = close
  }
  return out
}

/** The lines under a path of headings (e.g. ['API Reference', 'Context']) in one llms page, or null. */
function llmsBlock(title, path) {
  const page = llms.pages.get(title)
  if (!page) return null
  let from = page.start
  let to = page.end
  let level = 0
  for (const name of path) {
    const head = llms.heads.find(h => h.index >= from && h.index < to && h.level > level && h.text === name)
    if (!head) return null
    const next = llms.heads.find(h => h.index > head.index && h.index < to && h.level <= head.level)
    to = next ? next.index : to
    from = head.index + 1
    level = head.level
  }
  return trimBlank(llms.lines.slice(from, to))
}

/** Root-relative links become absolute, as the runner does for prose. */
function absolutize(text, siteUrl) {
  return text.replace(/\]\(\//g, `](${siteUrl}/`)
}

/** A fenced block; the fence grows if the code itself holds a triple backtick. */
function fencedBlock(lang, text) {
  const body = text.replace(/\n+$/, '')
  const mark = body.includes('```') ? '````' : '```'
  return `${mark}${lang}\n${body}\n${mark}`
}

/** Maps each line outside fenced code through fn. */
function transformProse(body, fn) {
  const out = []
  let fence = null
  for (const line of body.split('\n')) {
    const open = line.match(/^\s*(`{3,}|~{3,})/)
    if (fence) {
      if (open && open[1][0] === fence[0] && open[1].length >= fence.length && line.trim() === open[1]) fence = null
      out.push(line)
      continue
    }
    if (open) {
      fence = open[1]
      out.push(line)
      continue
    }
    out.push(fn(line))
  }
  return out.join('\n')
}

const IMG_TAG = /^\s*<img\s+([^>]*?)\s*\/>\s*$/

/** Markup the converter does not know: lowercase <img> and <kbd> in prose. */
function plainLine(line) {
  const img = line.match(IMG_TAG)
  if (img) {
    const src = img[1].match(/\bsrc="([^"]*)"/)
    const alt = img[1].match(/\balt="([^"]*)"/)
    if (src) return `![${alt ? alt[1] : ''}](${src[1]})`
  }
  return line.replace(/<kbd>([^<]*)<\/kbd>/g, (_, key) => `\`${key}\``)
}

/** Table cell text: one line, pipes escaped. */
function cell(text) {
  return String(text ?? '')
    .trim()
    .replace(/\r?\n/g, '<br>')
    .replace(/\|/g, '\\|')
}

function propsTable(entries) {
  const rows = entries.map(([name, p]) => {
    const type = p.type ? `\`${cell(p.type)}\`` : ''
    const dflt = p.defaultValue !== undefined ? `\`${cell(p.defaultValue)}\`` : ''
    return `| \`${name}\` | ${type} | ${p.isRequired ? 'yes' : 'no'} | ${dflt} | ${cell(p.description)} |`
  })
  return ['| Prop | Type | Required | Default | Description |', '| --- | --- | --- | --- | --- |', ...rows].join('\n')
}

/** Title of the page an id names, or else the page the hook sits on. */
function titleFor(id, ctx) {
  return titleById.get(String(id ?? '')) ?? pageByFile.get(ctx.file)?.title ?? ''
}

function kebab(name) {
  return String(name)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
}

/** The example source for <Example id component?>: its own file, or the progress variant folder. */
function exampleSource(props, ctx) {
  const page = pageByFile.get(ctx.file)
  const id = String(props.id ?? '')
  const explicit = typeof props.component === 'string'
  const variant = explicit ? undefined : PROGRESS_VARIANT[page?.id]
  const dirs = variant
    ? [`packages/react/src/components/progress/examples/${variant}`]
    : EXAMPLE_ROOTS.map(base => `${base}/${explicit ? props.component : page?.id}/examples`)
  for (const dir of dirs) {
    const text = ctx.readImport(join(ctx.root, dir, `${id}.tsx`))
    if (text != null) return text
  }
  return null
}

/** The bash block that follows the install paragraph in the React Getting Started export. */
function installFence(lines) {
  const at = lines.findIndex(line => line.startsWith('Install the Ark UI dependency'))
  if (at === -1) return null
  const open = lines.findIndex((line, i) => i > at && line.startsWith('```'))
  if (open === -1) return null
  const close = lines.findIndex((line, i) => i > open && line.trim() === '```')
  return close === -1 ? null : lines.slice(open, close + 1).join('\n')
}

/** The changelog text: the React export's `# Changelog` section, with its package heading demoted to H2. */
function changelogText(siteUrl) {
  const block = llmsBlock('Changelog', []) ?? []
  const lines = block.map(line => line.replace(/^# @/, '## @'))
  return absolutize(lines.join('\n'), siteUrl)
}

function walkMdx(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name)
    if (name.endsWith('.mdx')) out.push(full)
    else if (!name.includes('.')) walkMdx(full, out)
  }
  return out
}

export const components = {
  /**
   * The React export repeats the page's own hand-written anatomy fence here. When the
   * page source already holds that code, the hook adds nothing, so it is not shown twice.
   */
  Anatomy(props, _children, ctx) {
    const block = llmsBlock(titleFor(props.id, ctx), ['Anatomy'])
    if (!block || block.length === 0) return null
    const own = pageByFile.get(ctx.file)?.text ?? ''
    const fences = fencesIn(block)
    if (fences.length && fences.every(fence => own.includes(fence))) return ''
    return absolutize(block.join('\n'), ctx.siteUrl)
  },

  ComponentPreview(props, _children, ctx) {
    const text = ctx.readImport(join(ctx.root, DEMOS, `${kebab(props.id)}.demo.tsx`))
    return text == null ? null : fencedBlock('tsx', text)
  },

  ComponentTypes(props, _children, ctx) {
    const text = ctx.readImport(join(ctx.root, TYPES, `${String(props.id ?? '')}.types.json`))
    if (text == null) return null
    const title = titleFor(props.id, ctx)
    const out = []
    for (const [part, body] of Object.entries(JSON.parse(text))) {
      out.push('', `#### ${part}`, '')
      const renders = [body.tag && `\`<${body.tag}>\``, body.element && `\`${body.element}\``].filter(Boolean)
      if (renders.length) out.push(`Renders: ${renders.join(' (')}${renders.length > 1 ? ')' : ''}.`, '')
      const entries = Object.entries(body.props ?? {})
      if (entries.length) out.push(propsTable(entries), '')
      const attrs = llmsBlock(title, ['API Reference', part, 'Data Attributes'])
      if (attrs && attrs.length) out.push('##### Data Attributes', '', ...attrs, '')
    }
    return absolutize(out.join('\n').trim(), ctx.siteUrl)
  },

  ContextType(props, _children, ctx) {
    const title = titleFor(props.id, ctx)
    const block = llmsBlock(title, ['API Reference', 'Context']) ?? llmsBlock(title, ['Context'])
    return block ? absolutize(block.join('\n'), ctx.siteUrl) : null
  },

  Example: (props, _children, ctx) => {
    const text = exampleSource(props, ctx)
    return text == null ? null : fencedBlock('tsx', text)
  },

  ExampleCode: (props, _children, ctx) => {
    const text = exampleSource(props, ctx)
    return text == null ? null : fencedBlock('tsx', text)
  },

  Faq() {
    return '> FAQ: the questions and answers are not in this clone or in llms-react.txt.'
  },

  InstallCmd(_props, _children, ctx) {
    const block = llmsBlock(byFileTitle(ctx), ['Setup Guide'])
    const fence = block ? installFence(block) : null
    return fence ? absolutize(fence, ctx.siteUrl) : null
  },

  KeyBindingsTable(props, _children, ctx) {
    const title = titleFor(props.id, ctx)
    const block =
      llmsBlock(title, ['Accessibility', 'Keyboard Support']) ?? llmsBlock(title, ['Keyboard Support'])
    if (!block) return '> Table: keyboard bindings for this component are not in this clone or in llms-react.txt.'
    return absolutize(block.join('\n'), ctx.siteUrl)
  },

  Quickstart(_props, _children, ctx) {
    const block = llmsBlock(byFileTitle(ctx), ['Quickstart']) ?? []
    const links = block.filter(line => line.startsWith('- ['))
    return links.length ? absolutize(links.join('\n'), ctx.siteUrl) : null
  },

  Step(props, children) {
    const number = typeof props.number === 'string' ? `${props.number}. ` : ''
    const title = typeof props.title === 'string' ? props.title : ''
    return [`### ${number}${title}`, '', children].join('\n')
  },

  ThemeImage(props, _children, ctx) {
    const src = typeof props.srcLight === 'string' ? props.srcLight : ''
    if (!src) return null
    const alt = typeof props.alt === 'string' ? props.alt : ''
    const url = src.startsWith('/') ? `${ctx.siteUrl}${src}` : src
    return `![${alt}](${url})`
  },
}

function byFileTitle(ctx) {
  return pageByFile.get(ctx.file)?.title ?? ''
}

export default {
  source: SOURCE,

  async collect({ vendorDir, entry }) {
    const root = join(vendorDir, SOURCE)
    const pagesDir = join(root, PAGES)
    const nav = await loadNav(join(root, NAV))
    const llmsRel = (entry.llms ?? []).map(f => f.file).find(f => f.endsWith(LLMS_REACT))
    if (!llmsRel) throw new Error(`ark-ui: manifest row has no ${LLMS_REACT}`)
    const llmsPath = join(root, llmsRel)
    llms = parseLlms(readFileSync(llmsPath, 'utf8'))
    pageByFile.clear()
    titleById.clear()

    const pages = []
    const navIds = new Set()
    const noContent = []
    let fromMdx = 0
    let fromLlms = 0

    for (const group of nav.sidebarConfig) {
      const folder = FOLDER_BY_GROUP[group.title]
      if (!folder) throw new Error(`ark-ui: nav group '${group.title}' has no folder mapping`)
      for (const item of group.items) {
        const id = item.id
        navIds.add(id)
        const slug = `${folder}/${id}`
        const url = `${SITE}${DOCS_PATH}${slug}`
        const type = TYPE_BY_ID[id] ?? TYPE_BY_GROUP[group.title] ?? 'other'
        const file = join(pagesDir, folder, `${id}.mdx`)

        if (existsSync(file)) {
          const { data, body } = parseFrontmatter(readFileSync(file, 'utf8'))
          const title = data.title || item.title || id
          const text = transformProse(body, plainLine)
          pageByFile.set(file, { id, title, text })
          titleById.set(id, title)
          fromMdx++
          pages.push({
            slug,
            title,
            description: data.description ?? '',
            url,
            section: group.title,
            type,
            path: `${REPO}${PAGES}/${folder}/${id}.mdx`,
            file,
            format: 'mdx',
            text,
          })
        } else if (id === CHANGELOG_ID && llms.pages.has('Changelog')) {
          const title = 'Changelog'
          pageByFile.set(llmsPath, { id, title })
          titleById.set(id, title)
          fromLlms++
          pages.push({
            slug,
            title,
            description: '',
            url,
            section: group.title,
            type,
            path: `${REPO}${llmsRel}`,
            file: llmsPath,
            format: 'md',
            text: changelogText(SITE),
          })
        } else {
          noContent.push(`${item.title ?? id} (${slug}): no MDX file`)
        }
      }
    }

    const blogCount = walkMdx(join(root, BLOG)).length
    const notInNav = walkMdx(pagesDir)
      .map(f => f.slice(pagesDir.length + 1).replace(/\.mdx$/, ''))
      .filter(rel => !navIds.has(rel.split('/').pop()))
    const inLlms = pages.filter(p => llms.pages.has(p.title)).length
    const unmatched = pages.filter(p => !llms.pages.has(p.title)).map(p => p.title)

    const report = [
      `nav: ${navIds.size} items; ${fromMdx} pages from MDX, ${fromLlms} from ${LLMS_REACT} (changelog)`,
      `blog excluded: ${blogCount} posts (the docs nav does not link them)`,
      `MDX not in nav (excluded): ${notInNav.join(' | ') || 'none'}`,
      `nav without content: ${noContent.join(' | ') || 'none'}`,
      `${LLMS_REACT} title match: ${inLlms} of ${pages.length} pages; unmatched: ${unmatched.join(' | ') || 'none'}`,
    ]

    return { root, siteUrl: SITE, pages, report }
  },
}
