import { slugify } from './slug'

/**
 * Rehype pass that keeps `###` ids unique on a page. A sub-heading whose slug
 * already appeared, such as "Usage" under each section, gets its section's slug
 * as a prefix (`fonts-usage`). Unique headings keep the plain slug, so existing
 * links stay valid.
 */

type HastNode = {
  type: string
  tagName?: string
  value?: string
  properties?: Record<string, unknown>
  children?: HastNode[]
}

function textOf(node: HastNode): string {
  if (node.type === 'text') return node.value ?? ''
  return (node.children ?? []).map(textOf).join('')
}

function uniqueId(slug: string, section: string, seen: Set<string>): string {
  const id = seen.has(slug) && section ? `${section}-${slug}` : slug
  seen.add(id)
  return id
}

const isHeading = (node: HastNode) => node.tagName === 'h2' || node.tagName === 'h3'

export function rehypeSectionIds() {
  return (tree: HastNode) => {
    const seen = new Set<string>()
    let section = ''
    for (const node of (tree.children ?? []).filter(isHeading)) {
      const slug = slugify(textOf(node))
      if (node.tagName === 'h2') {
        section = slug
        seen.add(slug)
        continue
      }
      const id = uniqueId(slug, section, seen)
      if (id !== slug) node.properties = { ...node.properties, id }
    }
  }
}
