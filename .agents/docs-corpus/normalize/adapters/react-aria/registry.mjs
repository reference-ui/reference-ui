/**
 * The page registry for the react-aria hooks. collect() fills it with every live page of the source,
 * so a hook can resolve its page's own URL (for relative links and cards) and list a section's pages.
 */

let pages = []
const byFile = new Map()

/** Replaces the registry; called once per run by collect(). */
export function setPageRegistry(list) {
  pages = list
  byFile.clear()
  for (const page of list) byFile.set(page.file, page)
}

export function registryPages() {
  return pages
}

/** The page whose source file is `file`, or null. */
export function pageOf(file) {
  return byFile.get(file) ?? null
}

const URL_LIKE = /^[A-Za-z0-9#./:?=%&~+@_-]+$/

/**
 * An href from a JSX attribute as a live absolute URL, resolved against the page it sits on.
 * Expressions (`{...}`) and anything else that is not URL-shaped give ''.
 */
export function absoluteHref(href, file) {
  if (!href || !URL_LIKE.test(href)) return ''
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return href
  const page = byFile.get(file)
  if (!page) return href
  if (href.startsWith('#')) return `${page.url}${href}`
  try {
    return new URL(href.replace(/\.html$/, ''), page.url).href
  } catch {
    return ''
  }
}
