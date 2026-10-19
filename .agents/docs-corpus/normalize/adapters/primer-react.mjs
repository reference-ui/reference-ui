/**
 * primer-react adapter. The page list is the live primer.style sidebar, kept
 * as `primer-react/nav.json` because the clone has no nav config. Each
 * Components entry becomes one page built from its `*.docs.json`: the import
 * path, status and passthrough facts, one props table per component or
 * subcomponent, and the stories the docs list, inlined as fenced source from
 * the clone's `*.stories.tsx`. Each React Hooks entry becomes one page built
 * from its `*.hookDocs.json`: parameters and returns tables, related types, and
 * the same examples. `contributor-docs/` and `migrating.md` become guide pages
 * whose url is their GitHub file at the pinned commit. Nav entries the clone
 * cannot source are reported, not invented.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, posix, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseFrontmatter } from '../lib/frontmatter.mjs'

const SOURCE = 'primer-react'
const HERE = dirname(fileURLToPath(import.meta.url))
const SITE = 'https://primer.style'
const REPO = 'https://github.com/primer/react'
const REPO_PATH = 'vendor/docs/primer-react'
const TABLE_HEAD = ['Prop', 'Type', 'Default', 'Required', 'Description']
const FENCE = /^\s*(`{3,}|~{3,})/
const RELATIVE_LINK = /\]\((?![a-z][a-z0-9+.-]*:|[#/])([^()\s]+)((?:\s+"[^"]*")?)\)/gi

/** Files under `dir` whose name passes `test`, in path order. */
function filesUnder(dir, test, out = []) {
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) filesUnder(full, test, out)
    else if (test(name)) out.push(full)
  }
  return out
}

/** The live nav slug of a component name: `ActionBar` -> `action-bar`. */
const kebab = name => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

/** Storybook's id segment for a title or story name (matches its toId). */
function sanitize(text) {
  return text
    .toLowerCase()
    .replace(/[ ’–—―′¿'`~!@#$%^&*()_|+\-=?;:'",.<>{}[\]\\/]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Storybook's story name for an export: `LoadingWithTrailingAction` -> `Loading With Trailing Action`. */
function storyName(exportName) {
  return exportName
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-zA-Z])([0-9])/g, '$1 $2')
    .replace(/([0-9])([a-zA-Z])/g, '$1 $2')
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map(word => word[0].toUpperCase() + word.slice(1))
    .join(' ')
}

/** Storybook story id -> { name, text } for every export of every story file in the clone. */
function storyIndex(srcDir) {
  const index = new Map()
  for (const file of filesUnder(srcDir, name => name.endsWith('.stories.tsx'))) {
    const text = readFileSync(file, 'utf8')
    const title = text.match(/^\s*title:\s*['"]([^'"]+)['"]/m)?.[1]
    if (!title) continue
    for (const [, name] of text.matchAll(/^export (?:const|function|let) ([A-Za-z_]\w*)/gm)) {
      const id = `${sanitize(title)}--${sanitize(storyName(name))}`
      if (!index.has(id)) index.set(id, { name, text })
    }
  }
  return index
}

/** The source of `export const <name>`: its lines up to the next top-level statement. */
function exportSource(text, name) {
  const lines = text.split('\n')
  const pattern = new RegExp(`^export (?:const|function|let) ${name}(?![\\w$])`)
  const start = lines.findIndex(line => pattern.test(line))
  if (start < 0) return null
  let end = start + 1
  // Statement bodies are indented or close with a bracket; a column-0 word starts the next statement.
  while (end < lines.length && (lines[end].trim() === '' || /^[\s)\]};]/.test(lines[end]))) end++
  return lines.slice(start, end).join('\n').trimEnd()
}

/** One line of text: source line breaks become spaces, as a soft wrap renders. */
const flat = value => String(value ?? '').replace(/\s*\n\s*/g, ' ').trim()

/** Inline code for a value; the backtick run is longer than any inside it. */
function code(value) {
  const text = flat(value)
  const longest = Math.max(0, ...[...text.matchAll(/`+/g)].map(m => m[0].length))
  const mark = '`'.repeat(longest + 1)
  return longest === 0 ? `${mark}${text}${mark}` : `${mark} ${text} ${mark}`
}

/** A fenced block whose fence is longer than any backtick run in the code. */
function fenced(code, info) {
  const longest = Math.max(0, ...[...code.matchAll(/`+/g)].map(m => m[0].length))
  const mark = '`'.repeat(Math.max(3, longest + 1))
  return [`${mark}${info}`, code, mark]
}

/** A table cell: one line, `|` escaped, and the site's root links made absolute. */
const cell = value => flat(value).replace(/(?<!\\)\|/g, '\\|').replace(/\]\(\//g, `](${SITE}/`)

/** One props table: name, type, default, required and description, as docs.json gives them. */
function propsTable(props, label = 'Prop') {
  const rows = props.map(prop => {
    const flags = []
    if (prop.deprecated) flags.push(typeof prop.deprecated === 'string' ? `deprecated: ${flat(prop.deprecated)}` : 'deprecated')
    if (prop.derive !== undefined) flags.push(`derive: ${flat(prop.derive)}`)
    const fallback = prop.defaultValue ?? prop.default
    return [
      code(prop.name) + flags.map(flag => ` *(${flag})*`).join(''),
      prop.type ? code(prop.type) : '',
      fallback === undefined || fallback === '' ? '' : code(fallback),
      prop.required ? 'yes' : '',
      prop.description ?? prop.describedby ?? '',
    ].map(cell)
  })
  const head = [label, ...TABLE_HEAD.slice(1)]
  return [
    `| ${head.join(' | ')} |`,
    `| ${head.map(() => '---').join(' | ')} |`,
    ...rows.map(row => `| ${row.join(' | ')} |`),
  ]
}

/** The returns table: one row for the returned type and its description. */
function returnsTable(returns) {
  return ['| Type | Description |', '| --- | --- |', `| ${cell(code(returns.type))} | ${cell(returns.description)} |`]
}

/** The element a component forwards its props to, with its reference link. */
function passthroughLine(pass) {
  const parts = []
  if (pass.element) parts.push(code(pass.element))
  if (typeof pass.url === 'string' && pass.url) parts.push(`(${pass.url.replace(/^\/(?!\/)/, `${SITE}/`)})`)
  return `- Passthrough element: ${parts.join(' ')}`
}

/** The Examples section: each story the docs list, inlined as fenced source from the clone. */
function examplesLines(refs, stories, missingStories) {
  if (!refs?.length) return []
  const out = ['## Examples', '']
  for (const ref of refs) {
    const story = stories.get(ref.id)
    const source = story && exportSource(story.text, story.name)
    if (!source) {
      missingStories.push(ref.id)
      out.push(`> Story source not in the clone: ${code(ref.id)}`, '')
      continue
    }
    out.push(`### ${story.name}`, '', ...fenced(source, 'tsx'), '')
  }
  return out
}

/** One component page's body: facts, a props table per (sub)component, then the stories the docs list. */
function componentBody(doc, stories, missingStories) {
  const out = []
  if (doc.importPath) out.push(`- Import path: ${code(doc.importPath)}`)
  if (doc.status) out.push(`- Status: ${flat(doc.status)}`)
  if (doc.a11yReviewed) out.push(`- Accessibility reviewed: ${flat(doc.a11yReviewed)}`)
  if (doc.passthrough) out.push(passthroughLine(doc.passthrough))
  out.push('')
  if (doc.props?.length) out.push('## Props', '', ...propsTable(doc.props), '')
  for (const sub of doc.subcomponents ?? []) {
    out.push(`## ${flat(sub.name)}`, '')
    if (sub.passthrough) out.push(passthroughLine(sub.passthrough), '')
    if (sub.props?.length) out.push(...propsTable(sub.props), '')
  }
  out.push(...examplesLines(doc.stories, stories, missingStories))
  return out.join('\n')
}

/** One hook page's body: facts, parameters and returns tables, related types, then the examples. */
function hookBody(doc, stories, missingStories) {
  const out = []
  if (doc.importPath) out.push(`- Import path: ${code(doc.importPath)}`)
  if (doc.status) out.push(`- Status: ${flat(doc.status)}`)
  out.push('')
  if (doc.parameters?.length) out.push('## Parameters', '', ...propsTable(doc.parameters, 'Parameter'), '')
  if (doc.returns?.type) out.push('## Returns', '', ...returnsTable(doc.returns), '')
  if (doc.relatedTypes?.length) {
    out.push('## Related types', '')
    for (const related of doc.relatedTypes) {
      out.push(`### ${flat(related.name)}`, '')
      if (related.properties?.length) out.push(...propsTable(related.properties, 'Property'), '')
    }
  }
  out.push(...examplesLines(doc.stories, stories, missingStories))
  return out.join('\n')
}

/** Applies `fn` to the prose parts of a line, skipping inline code spans. */
function mapProse(line, fn) {
  let out = ''
  let last = 0
  for (const m of line.matchAll(/(`+)[\s\S]*?\1/g)) {
    out += fn(line.slice(last, m.index)) + m[0]
    last = m.index + m[0].length
  }
  return out + fn(line.slice(last))
}

/** Relative links in a repo Markdown file become GitHub URLs at the pinned commit, so they resolve from the corpus. */
function rewriteRelativeLinks(markdown, rel, commit) {
  let count = 0
  const dir = posix.dirname(rel)
  const replaceLink = (_, target, title) => {
    const hash = target.indexOf('#')
    const path = hash === -1 ? target : target.slice(0, hash)
    const anchor = hash === -1 ? '' : target.slice(hash)
    const resolved = posix.normalize(posix.join(dir, path))
    count++
    return `](${REPO}/${path.endsWith('/') ? 'tree' : 'blob'}/${commit}/${resolved}${anchor}${title})`
  }
  let inFence = false
  const text = markdown
    .split('\n')
    .map(line => {
      if (FENCE.test(line)) {
        inFence = !inFence
        return line
      }
      return inFence ? line : mapProse(line, part => part.replace(RELATIVE_LINK, replaceLink))
    })
    .join('\n')
  return { text, count }
}

/** The first H1 of a Markdown body, or the file name when it has none. */
function titleOf(body, rel) {
  const h1 = body.split('\n').find(line => /^# \S/.test(line))
  return h1 ? h1.replace(/^# /, '').trim() : posix.basename(rel, '.md')
}

export default {
  source: SOURCE,

  async collect({ vendorDir, entry }) {
    const root = join(vendorDir, SOURCE)
    const srcDir = join(root, 'packages', 'react', 'src')
    const nav = JSON.parse(readFileSync(join(HERE, 'primer-react', 'nav.json'), 'utf8'))
    const docs = filesUnder(srcDir, name => name.endsWith('.docs.json')).map(file => ({
      file,
      rel: relative(root, file),
      doc: JSON.parse(readFileSync(file, 'utf8')),
    }))
    const hookDocs = filesUnder(srcDir, name => name.endsWith('.hookDocs.json')).map(file => ({
      file,
      rel: relative(root, file),
      doc: JSON.parse(readFileSync(file, 'utf8')),
    }))
    const stories = storyIndex(srcDir)
    const pages = []
    const report = []
    const missingStories = []
    const claimed = new Set()

    const components = nav.groups.find(group => group.title === 'Components')
    const notProduced = []
    for (const item of components.items) {
      const slug = item.href.split('/').filter(Boolean).pop()
      const candidates = docs.filter(d => kebab(d.doc.name) === slug)
      const live = candidates.find(d => d.doc.status !== 'deprecated') ?? candidates[0]
      if (!live) {
        notProduced.push(item.title)
        continue
      }
      claimed.add(live)
      pages.push({
        slug: `components/${slug}`,
        title: live.doc.name,
        description: '',
        url: `${SITE}${item.href}`,
        section: 'Components',
        type: 'component',
        path: `${REPO_PATH}/${live.rel}`,
        file: live.file,
        format: 'md',
        text: componentBody(live.doc, stories, missingStories),
      })
    }
    const componentCount = pages.length
    const pageSlugs = new Set(pages.map(page => page.slug))
    const variants = docs.filter(d => !claimed.has(d) && pageSlugs.has(`components/${kebab(d.doc.name)}`))
    const orphans = docs.filter(d => !claimed.has(d) && !pageSlugs.has(`components/${kebab(d.doc.name)}`))

    const hooks = nav.groups.find(group => group.title === 'React Hooks')
    const hooksNotProduced = []
    const hookClaimed = new Set()
    for (const item of hooks.items) {
      const name = item.href.split('/').filter(Boolean).pop()
      const hook = hookDocs.find(h => h.doc.name === name)
      if (!hook) {
        hooksNotProduced.push(name)
        continue
      }
      hookClaimed.add(hook)
      pages.push({
        slug: `hooks/${name}`,
        title: hook.doc.name,
        description: '',
        url: `${SITE}${item.href}`,
        section: 'React Hooks',
        type: 'api-reference',
        path: `${REPO_PATH}/${hook.rel}`,
        file: hook.file,
        format: 'md',
        text: hookBody(hook.doc, stories, missingStories),
      })
    }
    const hookOrphans = hookDocs.filter(h => !hookClaimed.has(h))

    const guideFiles = [join(root, 'migrating.md'), ...filesUnder(join(root, 'contributor-docs'), n => n.endsWith('.md'))]
    let links = 0
    for (const file of guideFiles) {
      const rel = relative(root, file)
      const { body } = parseFrontmatter(readFileSync(file, 'utf8'))
      const rewritten = rewriteRelativeLinks(body, rel, entry.commit)
      links += rewritten.count
      pages.push({
        slug: rel.replace(/\.md$/, ''),
        title: titleOf(body, rel),
        description: '',
        url: `${REPO}/blob/${entry.commit}/${rel}`,
        section: rel === 'migrating.md' ? 'Migration' : rel.includes('/adrs/') ? 'Contributor docs / ADRs' : 'Contributor docs',
        type: 'guide',
        path: `${REPO_PATH}/${rel}`,
        file,
        format: 'md',
        text: rewritten.text,
      })
    }

    const refs = [...claimed, ...hookClaimed].reduce((sum, d) => sum + (d.doc.stories?.length ?? 0), 0)
    report.push(`components: ${componentCount} pages from ${components.items.length} live Components entries`)
    report.push(`hooks: ${hooks.items.length - hooksNotProduced.length} pages from ${hooks.items.length} live React Hooks entries (*.hookDocs.json)`)
    report.push(`stories: ${refs} references in rendered docs, ${refs - missingStories.length} inlined, ${missingStories.length} not in the clone`)
    report.push(`docs.json not rendered, deprecated or beta variant beside its live page (${variants.length}): ${variants.map(d => d.rel).join(', ') || 'none'}`)
    report.push(`docs.json with no live nav entry (${orphans.length}): ${orphans.map(d => d.doc.name).join(', ') || 'none'}`)
    report.push(`hookDocs.json with no live nav entry (${hookOrphans.length}): ${hookOrphans.map(h => h.doc.name).join(', ') || 'none'}`)
    report.push(`nav entries not produced, Components (${notProduced.length}): ${notProduced.join(', ') || 'none'}; React Hooks (${hooksNotProduced.length}): ${hooksNotProduced.map(name => `${name}, no hookDocs.json in the clone`).join('; ') || 'none'}`)
    const unsourced = new Map()
    for (const group of nav.groups) {
      if (group.title === 'Components' || group.title === 'React Hooks') continue
      for (const item of group.items) {
        const reason = item.href.startsWith('/product/internal-components/')
          ? 'Internal Components: no source in the primer-react clone'
          : item.href.startsWith('/product/getting-started/react')
            ? 'Getting Started / React: text is primer.style content, not in the clone'
            : 'other site sections: not primer-react content'
        unsourced.set(reason, (unsourced.get(reason) ?? 0) + 1)
      }
    }
    for (const [reason, count] of unsourced) report.push(`not produced (${count}), ${reason}`)
    report.push(`guides: ${guideFiles.length} pages (migrating.md and contributor-docs), url is the GitHub file at ${entry.commit.slice(0, 7)}, not a live page`)
    report.push(`guides: ${links} relative links rewritten to GitHub URLs`)

    return { root, siteUrl: SITE, pages, report }
  },
}
