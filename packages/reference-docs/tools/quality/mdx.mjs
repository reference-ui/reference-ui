// MDX tier of the docs gate. It takes the docs package directory and the path arguments, and emits
// findings for the .mdx pages they name (every page under src/content with no arguments): compile
// errors, the frontmatter contract, em dashes in prose, internal links and anchors, and unique
// slugs. Link targets come from every docs page, so a path-scoped run still resolves them.
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import { compilePool, laneCount } from './mdx-pool.mjs'
import { loadCompiler } from './mdx-compile.mjs'
import { checkContract, parseFrontmatter } from './mdx-frontmatter.mjs'
import { linkFindings } from './mdx-links.mjs'
import { emDashLines } from './mdx-prose.mjs'
import { walk } from './walk.mjs'

const MDX_EXTS = new Set(['.mdx'])
const DASH_MESSAGE = 'em dash (U+2014) in prose; use a colon, a comma or parentheses'

/** Runs the MDX checks on the page paths given, or on all of src/content. */
export async function mdxTier({ docsDir, paths }) {
  const started = performance.now()
  const pages = await pageFiles(docsDir, paths)
  if (!pages.length) return { errors: [], pages: 0, ms: 0, missing: null, detail: null }
  const site = {
    docsDir,
    compiler: null,
    texts: new Map(),
    frontmatter: new Map(),
    slugFiles: new Map(),
    compiled: new Map(),
  }
  try {
    await compileUpFront(site, pages)
  } catch (err) {
    return {
      errors: [],
      pages: pages.length,
      ms: 0,
      missing: 'mdx',
      detail: err.message.split('\n')[0],
    }
  }
  await indexSite(site, pages)
  const errors = []
  for (const file of pages) errors.push(...(await checkPage(site, file)))
  const ms = Math.round(performance.now() - started)
  return { errors, pages: pages.length, ms, missing: null, detail: null }
}

async function pageFiles(docsDir, paths) {
  const found = new Set()
  const roots = paths.length ? paths : [path.join(docsDir, 'src/content')]
  for (const root of roots) await walk(root, MDX_EXTS, found)
  return [...found].sort()
}

/** Compiles every page on the worker pool, or loads the compiler here for a small run. */
async function compileUpFront(site, pages) {
  const lanes = laneCount(pages.length)
  if (lanes > 1) site.compiled = await compilePool(pages, lanes)
  else site.compiler = await loadCompiler()
}

/** Reads every page the links can name: the docs collection plus any page on the command line. */
async function indexSite(site, pages) {
  const all = new Set()
  await walk(path.join(site.docsDir, 'src/content/docs'), MDX_EXTS, all)
  for (const file of pages) all.add(file)
  for (const file of [...all].sort()) {
    const fm = parseFrontmatter(await textOf(site, file))
    site.frontmatter.set(file, fm)
    const slug = fm.fields.get('slug')
    if (slug?.type === 'string')
      site.slugFiles.set(slug.value, [...(site.slugFiles.get(slug.value) ?? []), file])
  }
}

async function textOf(site, file) {
  if (!site.texts.has(file)) site.texts.set(file, await readFile(file, 'utf8'))
  return site.texts.get(file)
}

/** A page's compile result. Pages the pool did not compile load the compiler here on first use. */
async function compiledOf(site, file) {
  if (!site.compiled.has(file)) {
    site.compiler ??= await loadCompiler()
    site.compiled.set(file, await site.compiler.compile(file, await textOf(site, file)))
  }
  return site.compiled.get(file)
}

/** Heading ids of the page that owns `slug`, or `null` when the page is unknown or does not compile. */
async function headingsOf(site, slug) {
  const files = site.slugFiles.get(slug)
  if (!files) return null
  const compiled = await compiledOf(site, files[0])
  return compiled.error ? null : compiled.headings
}

async function checkPage(site, file) {
  const text = await textOf(site, file)
  const fm = site.frontmatter.get(file)
  const found = [
    ...fm.errors.map(e => ({
      line: e.line,
      ruleId: 'docs/frontmatter',
      message: e.message,
    })),
    ...checkContract(fm.fields).map(e => ({ ...e, ruleId: 'docs/frontmatter' })),
    ...slugFindings(site, file, fm),
    ...emDashLines(text, fm.bodyLine).map(line => ({
      line,
      ruleId: 'docs/dash',
      message: DASH_MESSAGE,
    })),
  ]
  const compiled = await compiledOf(site, file)
  if (compiled.error) {
    found.push({
      line: compiled.error.line,
      ruleId: 'docs/mdx-compile',
      message: compiled.error.message,
    })
  } else {
    const ctx = {
      selfSlug: fm.fields.get('slug')?.value ?? null,
      slugs: new Set(site.slugFiles.keys()),
      headingsOf: slug => headingsOf(site, slug),
    }
    found.push(...(await linkFindings(compiled.links, ctx)))
  }
  return found.map(f => ({ ...f, file, severity: 2 }))
}

function slugFindings(site, file, fm) {
  const slug = fm.fields.get('slug')
  if (slug?.type !== 'string') return []
  const others = (site.slugFiles.get(slug.value) ?? []).filter(other => other !== file)
  if (!others.length) return []
  const names = others.map(other => path.relative(site.docsDir, other)).join(', ')
  return [
    {
      line: slug.line,
      ruleId: 'docs/slug',
      message: `"${slug.value}" is also the slug of ${names}`,
    },
  ]
}
