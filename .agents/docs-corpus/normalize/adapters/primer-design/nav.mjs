/**
 * The site's nav config (`src/@primer/gatsby-theme-doctocat/nav.yml`) is a tree
 * of `title`, `url` and `children`. This reads exactly that YAML subset and
 * throws on any other line, so a changed nav stops the run instead of silently
 * dropping pages.
 */

/** The nav tree: [{ title, url?, children: [...] }]. */
export function parseNav(text) {
  const roots = []
  const stack = []
  let node = null
  text.split('\n').forEach((raw, i) => {
    if (!raw.trim()) return
    const indent = raw.search(/\S/)
    let body = raw.slice(indent)
    if (body.startsWith('- ')) {
      body = body.slice(2)
      while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop()
      node = { children: [] }
      const parent = stack.length ? stack[stack.length - 1].node : null
      ;(parent ? parent.children : roots).push(node)
      stack.push({ indent, node })
    }
    const kv = body.match(/^(title|url|children):(?:\s+(.*))?$/)
    if (!kv || !node) throw new Error(`nav.yml line ${i + 1}: unsupported line: ${raw.trim()}`)
    if (kv[1] !== 'children') node[kv[1]] = (kv[2] ?? '').trim()
  })
  return roots
}

/**
 * Every nav entry that has a url, once per url, in nav order. A url listed
 * twice (a group and its first child) keeps its first position and takes the
 * deepest entry's title and ancestors: the leaf is the page itself.
 */
export function navPages(roots) {
  const pages = new Map()
  const walk = (nodes, ancestors) => {
    for (const node of nodes) {
      if (node.url !== undefined) {
        const rec = { url: node.url, title: node.title ?? '', ancestors, depth: ancestors.length }
        const prev = pages.get(node.url)
        if (!prev) pages.set(node.url, rec)
        else if (rec.depth > prev.depth) Object.assign(prev, rec)
      }
      walk(node.children, node.title === undefined ? ancestors : [...ancestors, node.title])
    }
  }
  walk(roots, [])
  return [...pages.values()]
}

/** The nav group at a `Title/Child/Grandchild` path, or null. */
export function findGroup(roots, path) {
  let nodes = roots
  let found = null
  for (const part of path.split('/')) {
    found = nodes.find(node => node.title === part) ?? null
    if (!found) return null
    nodes = found.children
  }
  return found
}
