import * as Icons from '@reference-ui/icons'

const ALL_ICON_NAMES = Object.keys(Icons).filter(k => k.endsWith('Icon')).sort()

export function searchIcons(options?: { query?: string; limit?: number }) {
  let names = ALL_ICON_NAMES
  if (options?.query) {
    const q = options.query.toLowerCase()
    names = names.filter(n => n.toLowerCase().includes(q))
  }
  const limit = options?.limit && options.limit > 0 ? Math.min(options.limit, 200) : 50
  return {
    total: names.length,
    returned: Math.min(names.length, limit),
    icons: names.slice(0, limit).map(name => ({
      name,
      import: `import { ${name} } from '@reference-ui/icons'`,
      example: `<${name} size="md" color="text" />`,
    })),
  }
}
