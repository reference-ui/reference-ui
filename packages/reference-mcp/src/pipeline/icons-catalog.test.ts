import { describe, expect, it } from 'vitest'
import { searchIcons, ICON_CATEGORIES } from './icons-catalog'

describe('icons-catalog', () => {
  it('returns instructional guidance and 0 icons when called without a query or category', () => {
    const result = searchIcons()
    expect(result.totalAvailable).toBeGreaterThan(3000)
    expect(result.total).toBe(0)
    expect(result.returned).toBe(0)
    expect(result.icons).toEqual([])
    expect(result).toHaveProperty('message')
    expect(result.message).toContain('3,800+ Material Symbols React icons')
    expect(result.categories).toEqual(expect.arrayContaining(['action', 'navigation', 'editor']))
    expect(result.examples).toBeDefined()
  })

  it('searches semantically: "trash" finds DeleteIcon', () => {
    const result = searchIcons({ query: 'trash' })
    expect(result.total).toBeGreaterThan(0)
    expect(result.icons[0]?.name).toBe('DeleteIcon')
    expect(result.icons[0]?.import).toBe("import { DeleteIcon } from '@reference-ui/icons'")
    expect(result.icons[0]?.description).toContain('Delete')
    expect(result.icons[0]?.category).toBe('action')
    expect(result.icons[0]?.example).toContain('<DeleteIcon size="md"')
  })

  it('searches semantically: "magnifying glass" finds SearchIcon', () => {
    const result = searchIcons({ query: 'magnifying glass' })
    expect(result.total).toBeGreaterThan(0)
    const names = result.icons.map(i => i.name)
    expect(names).toContain('SearchIcon')
  })

  it('searches semantically: "pencil" finds EditIcon', () => {
    const result = searchIcons({ query: 'pencil' })
    expect(result.total).toBeGreaterThan(0)
    expect(result.icons[0]?.name).toBe('EditIcon')
  })

  it('searches semantically: "cross" finds CloseIcon', () => {
    const result = searchIcons({ query: 'cross' })
    expect(result.total).toBeGreaterThan(0)
    expect(result.icons[0]?.name).toBe('CloseIcon')
  })

  it('filters by category', () => {
    const result = searchIcons({ category: 'navigation', limit: 10 })
    expect(result.returned).toBe(10)
    expect(result.icons.every(i => i.category === 'navigation')).toBe(true)
  })

  it('respects limit parameter', () => {
    const result = searchIcons({ query: 'arrow', limit: 5 })
    expect(result.total).toBeGreaterThan(5)
    expect(result.returned).toBe(5)
    expect(result.icons).toHaveLength(5)
  })
})
