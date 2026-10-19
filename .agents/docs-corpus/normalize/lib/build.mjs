/**
 * One source's build, with no filesystem writes. It checks the adapter's
 * pages against the contract, converts each body, splits sections, lays out
 * the output files, and refuses any two outputs that would land on the same
 * path. Pure, so the layout rules can be tested directly.
 *
 * Layout, relative to _normalized/:
 *   <source>/<slug>.md                 one page
 *   <source>/<slug>.sections/<heading>.md   that page's H2 (or H3) sections
 * A section lives under its page's own `.sections` folder, so a child page
 * can never share a file with a parent's section.
 */

import { isAbsolute } from 'node:path'
import { convertMdx, applyDirectives, countUnresolved } from './mdx.mjs'
import { formatFrontmatter, parseFrontmatter } from './frontmatter.mjs'
import { headingTexts, slugify, splitSections, uniqueSlug } from './sections.mjs'
import { tagConcepts } from './concepts.mjs'

export const TYPES = new Set([
  'install', 'guide', 'concept', 'component', 'api-reference', 'theming',
  'migration', 'faq', 'changelog', 'blog', 'ai', 'other',
])
const FORMATS = new Set(['mdx', 'md'])
const OPTIONAL_TEXT = ['repo', 'commit', 'license']

/** Directory that holds one page's section files. */
export function sectionsDir(slug) {
  return `${slug}.sections`
}

/** The adapter's collect() result must name a clone and carry pages. */
export function checkCollected(got, name) {
  const fail = message => {
    throw new Error(`adapters/${name}.mjs: ${message}`)
  }
  if (!got || typeof got !== 'object') fail('collect() must return { root, siteUrl, pages, report }')
  if (!isAbsolute(got.root ?? '')) fail('collect() must return an absolute root (the clone directory)')
  if (typeof (got.siteUrl ?? '') !== 'string') fail("siteUrl must be a string ('' when the site has none)")
  if (!Array.isArray(got.pages)) fail('pages must be an array')
  if (got.report !== undefined && !Array.isArray(got.report)) fail('report must be an array of lines')
}

/**
 * The adapter contract for one page. `repo`, `commit` and `license` are
 * optional overrides of the manifest row, for pages whose provenance differs
 * from the source's (a monorepo's docs pinned to another commit, say).
 */
export function checkPage(page, name, seen) {
  const fail = message => {
    throw new Error(`adapters/${name}.mjs: page '${page?.slug ?? '?'}' ${message}`)
  }
  if (!page || typeof page !== 'object') throw new Error(`adapters/${name}.mjs: a page is not an object`)
  if (typeof page.slug !== 'string' || !page.slug || isAbsolute(page.slug) || page.slug.split('/').includes('..')) {
    fail('needs a relative slug')
  }
  if (seen.has(page.slug)) fail('repeats a slug already used by this source')
  seen.add(page.slug)
  if (typeof page.title !== 'string' || !page.title.trim()) fail('needs a title')
  if (typeof page.description !== 'string') fail("needs a description string ('' if none)")
  if (typeof page.url !== 'string' || !page.url) fail('needs a live url')
  if (typeof page.section !== 'string') fail('needs a section string')
  if (!TYPES.has(page.type)) fail(`has type '${page.type}'; use one of: ${[...TYPES].join(', ')}`)
  if (typeof page.path !== 'string' || !page.path) fail('needs a repo-relative path')
  if (!isAbsolute(page.file ?? '')) fail('needs an absolute file path (the source file)')
  if (!FORMATS.has(page.format)) fail("needs format 'mdx' or 'md'")
  if (typeof page.text !== 'string') fail('needs text (the body)')
  if (Object.keys(parseFrontmatter(page.text).data).length > 0) fail('has frontmatter in text; pass the body only')
  for (const key of OPTIONAL_TEXT) {
    if (page[key] !== undefined && (typeof page[key] !== 'string' || !page[key])) {
      fail(`${key} must be a non-empty string when given`)
    }
  }
}

/** The page body as Markdown: MDX converted, or Markdown with directives applied. */
function bodyMarkdown(page, ctx) {
  if (page.format === 'md') return { markdown: applyDirectives(page.text), unresolved: countUnresolved(page.text) }
  return convertMdx(page.text, {
    siteUrl: ctx.siteUrl,
    file: page.file,
    root: ctx.root,
    readImport: ctx.readImport,
    components: ctx.components,
  })
}

/** The runner writes the title as the H1, so a leading H1 in the body is dropped. */
function dropLeadingH1(markdown) {
  const lines = markdown.split('\n')
  const first = lines.findIndex(line => line.trim() !== '')
  if (first !== -1 && /^#\s+\S/.test(lines[first])) lines.splice(first, 1)
  return lines.join('\n').replace(/^\s*\n/, '')
}

/** One page's rows and files: the page itself plus one file per section. */
function buildPage(page, ctx) {
  const { name, entry, vocabulary } = ctx
  const converted = bodyMarkdown(page, ctx)
  const markdown = dropLeadingH1(converted.markdown.trim())
  const pageId = `${name}:${page.slug}`
  const provenance = {
    repo: page.repo ?? entry.repo ?? '',
    commit: page.commit ?? entry.commit ?? '',
    license: page.license ?? entry.license ?? '',
  }
  const shared = { url: page.url, section: page.section, order: page.order, type: page.type, path: page.path, ...provenance }
  const pageConcepts = tagConcepts(
    { head: [page.title, page.description, ...headingTexts(markdown)].join('\n'), body: markdown },
    vocabulary
  )
  const pageBody = [`# ${page.title}`, '', page.description, '', markdown].filter((line, i, all) => {
    return !(line === '' && i > 0 && all[i - 1] === '')
  })
  const pageText = `${formatFrontmatter({
    id: pageId,
    source: name,
    title: page.title,
    description: page.description,
    url: shared.url,
    section: shared.section,
    order: shared.order,
    type: shared.type,
    concepts: pageConcepts,
    path: shared.path,
    repo: shared.repo,
    commit: shared.commit,
    license: shared.license,
  })}${pageBody.join('\n').trim()}\n`

  const used = new Set()
  const sections = splitSections(markdown, { pageTitle: page.title }).map(section => {
    const heading = uniqueSlug(slugify(section.heading), used)
    const id = `${pageId}#${heading}`
    const concepts = tagConcepts(
      { head: `${section.title}\n${section.heading}`, body: section.markdown },
      vocabulary
    )
    const text = `${formatFrontmatter({
      id,
      source: name,
      title: section.title,
      heading: section.heading,
      page: pageId,
      url: shared.url,
      section: shared.section,
      order: shared.order,
      type: shared.type,
      concepts,
      path: shared.path,
      repo: shared.repo,
      commit: shared.commit,
      license: shared.license,
    })}${section.markdown}`
    return { id, heading, concepts, text }
  })

  const row = {
    id: pageId,
    source: name,
    title: page.title,
    description: page.description,
    url: shared.url,
    section: shared.section,
    order: shared.order,
    type: shared.type,
    concepts: pageConcepts,
    path: shared.path,
    file: `${name}/${page.slug}.md`,
    sections: sections.map(s => s.id),
    repo: shared.repo,
    commit: shared.commit,
    license: shared.license,
  }
  const files = [
    { rel: `${name}/${page.slug}.md`, text: pageText, owner: `page ${page.slug}` },
    ...sections.map(s => ({
      rel: `${name}/${sectionsDir(page.slug)}/${s.heading}.md`,
      text: s.text,
      owner: `section ${s.id}`,
    })),
  ]
  return { row, files, unresolved: converted.unresolved, sectionCount: sections.length }
}

/**
 * Refuses two outputs on one path. Compared case-insensitively, because the
 * default macOS filesystem is case-insensitive and would merge them silently.
 */
export function assertUniquePaths(files, name) {
  const seen = new Map()
  for (const file of files) {
    const key = file.rel.toLowerCase()
    const prior = seen.get(key)
    if (prior) {
      throw new Error(`${name}: output path clash on '${file.rel}' (compared case-insensitively): ${prior.owner} and ${file.owner}`)
    }
    seen.set(key, file)
  }
}

/**
 * Builds one source. `pages` is the adapter's list in nav order; the build
 * numbers `order` 1..n. Returns the index rows, the files to write (paths
 * relative to _normalized/), the unresolved counts, and the section count.
 */
export function buildSource({ name, entry, pages, root, siteUrl = '', readImport = () => null, components = {}, vocabulary = {} }) {
  const ordered = pages.map((page, i) => ({ ...page, order: i + 1 }))
  const seen = new Set()
  for (const page of ordered) checkPage(page, name, seen)
  const ctx = { name, entry, root, siteUrl, readImport, components, vocabulary }
  const unresolved = new Map()
  const rows = []
  const files = []
  let sections = 0
  for (const page of ordered) {
    const built = buildPage(page, ctx)
    rows.push(built.row)
    files.push(...built.files)
    sections += built.sectionCount
    for (const [component, count] of built.unresolved) {
      unresolved.set(component, (unresolved.get(component) ?? 0) + count)
    }
  }
  assertUniquePaths(files, name)
  return { name, rows, files, unresolved, sections }
}
