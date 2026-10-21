// Internal link check for the docs gate. It takes a page's link list, the slugs of all docs
// pages, and a lookup of each page's heading ids, and emits a finding for each `/` link that
// names no page and each `#anchor` that names no heading. The router maps `/x` to the page with
// slug `x` and `/` to the index page (src/app/router.tsx); external and relative links are not
// checked.

/** The page the router renders at `/`. */
export const INDEX_SLUG = 'initialize'

/** Reads where an href points: `null` when the gate does not check it. */
export function linkTarget(href) {
  if (href.startsWith('#')) return { self: true, slug: null, hash: href.slice(1) }
  if (!href.startsWith('/') || href.startsWith('//')) return null
  const at = href.indexOf('#')
  const path = (at < 0 ? href : href.slice(0, at)).split('?')[0].replace(/\/+$/, '')
  const hash = at < 0 ? '' : href.slice(at + 1)
  return { self: false, slug: path === '' ? INDEX_SLUG : path.slice(1), hash }
}

function decodeHash(hash) {
  try {
    return decodeURIComponent(hash)
  } catch {
    return hash
  }
}

/**
 * Findings for one page's links. `ctx` carries `selfSlug`, the `slugs` Set of all pages, and
 * `headingsOf(slug)`, which resolves to that page's heading-id Set, or `null` when it cannot be read.
 */
export async function linkFindings(links, ctx) {
  const findings = []
  for (const link of links) {
    const finding = await linkProblem(link, ctx)
    if (finding) findings.push(finding)
  }
  return findings
}

async function linkProblem(link, ctx) {
  const target = linkTarget(link.href)
  if (!target) return null
  const slug = target.self ? ctx.selfSlug : target.slug
  if (!target.self && !ctx.slugs.has(slug)) {
    return {
      line: link.line,
      ruleId: 'docs/link',
      message: `"${link.href}" names no page; no page has slug "${slug}"`,
    }
  }
  if (!target.hash) return null
  const ids = await ctx.headingsOf(slug)
  if (ids && !ids.has(decodeHash(target.hash))) {
    return {
      line: link.line,
      ruleId: 'docs/anchor',
      message: `"${link.href}" names no heading on the "${slug}" page`,
    }
  }
  return null
}
