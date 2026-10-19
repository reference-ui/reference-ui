/**
 * Facets: the frontmatter fields a targeted search filters on and groups by.
 * `source` and `type` are the facets; any markdown collection whose docs carry
 * them gets them, and a doc without one sits outside that facet. Values compare
 * case-insensitively and keep the case they were written in for display.
 */

export const FACETS = ['source', 'type']

/** The facet values a doc carries, from its frontmatter fields: { source?, type? }. */
export function facetsOf(fields) {
  const facets = {}
  for (const name of FACETS) {
    const value = fields?.[name]
    if (value === undefined || value === null) continue
    const text = String(value).trim()
    if (text) facets[name] = text
  }
  return facets
}

/**
 * Whether a doc's facets pass every filter. Within one facet a doc passes when
 * its value is any of the listed ones; across facets every filter must pass.
 */
export function matchesFacets(facets, filters) {
  for (const [name, wanted] of Object.entries(filters)) {
    const value = facets?.[name]
    if (value === undefined) return false
    const lower = value.toLowerCase()
    if (!wanted.some(item => item.toLowerCase() === lower)) return false
  }
  return true
}

/** The distinct values one facet takes across a catalog of facet records, sorted. */
export function facetValues(catalog, name) {
  const values = new Map()
  for (const facets of catalog) {
    const value = facets?.[name]
    if (value !== undefined && !values.has(value.toLowerCase())) values.set(value.toLowerCase(), value)
  }
  return [...values.values()].sort((a, b) => a.localeCompare(b))
}
