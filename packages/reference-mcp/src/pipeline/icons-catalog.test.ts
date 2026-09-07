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

  it('searches semantically and returns lean { name, description } icon records by default', () => {
    const result = searchIcons({ query: 'trash' })
    expect(result.total).toBeGreaterThan(0)
    expect(result.icons[0]?.name).toBe('DeleteIcon')
    expect(result.icons[0]?.description).toContain('Delete')
    // Lean output: import and example omitted by default to conserve tokens
    expect(result.icons[0]?.import).toBeUndefined()
    expect(result.icons[0]?.example).toBeUndefined()
  })

  it('supports verbose=true to return import statement and example when explicitly requested', () => {
    const result = searchIcons({ query: 'trash', verbose: true })
    expect(result.total).toBeGreaterThan(0)
    expect(result.icons[0]?.name).toBe('DeleteIcon')
    expect(result.icons[0]?.import).toBe("import { DeleteIcon } from '@reference-ui/icons'")
    expect(result.icons[0]?.example).toContain('<DeleteIcon size="md"')
    expect(result.icons[0]?.category).toBe('action')
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

  it('performs fuzzy search with typo tolerance: "seach" finds SearchIcon', () => {
    const result = searchIcons({ query: 'seach' })
    expect(result.total).toBeGreaterThan(0)
    expect(result.icons[0]?.name).toBe('SearchIcon')
  })

  it('performs fuzzy search with typo tolerance: "setings" finds SettingsIcon', () => {
    const result = searchIcons({ query: 'setings' })
    expect(result.total).toBeGreaterThan(0)
    expect(result.icons[0]?.name).toBe('SettingsIcon')
  })

  it('resolves multi-demand natural language sentences in a single query', () => {
    const result = searchIcons({
      query: 'I need an icon for user settings, a shopping cart, and a trash can for deletion',
    })
    expect(result.totalDemands).toBe(3)
    expect(result.demands).toBeDefined()
    expect(result.demands).toHaveLength(3)

    const names = result.icons.map(i => i.name)
    expect(names.some(n => n.includes('Settings'))).toBe(true)
    expect(names.some(n => n.includes('Cart'))).toBe(true)
    expect(names.some(n => n.includes('Delete'))).toBe(true)
  })

  it('resolves explicit batch demands array in a single tool call', () => {
    const result = searchIcons({
      demands: ['shopping cart', 'trash', 'gear'],
    })
    expect(result.totalDemands).toBe(3)
    expect(result.demands).toHaveLength(3)
    expect(result.demands?.[0]?.demand).toBe('shopping cart')
    expect(result.demands?.[0]?.icons.some(i => i.name === 'ShoppingCartIcon')).toBe(true)
    expect(result.demands?.[1]?.demand).toBe('trash')
    expect(result.demands?.[1]?.icons.some(i => i.name === 'DeleteIcon')).toBe(true)
    expect(result.demands?.[2]?.demand).toBe('gear')
    expect(result.demands?.[2]?.icons.some(i => i.name === 'SettingsIcon')).toBe(true)
  })

  it('filters by category when browsing or searching', () => {
    const result = searchIcons({ category: 'navigation', limit: 10, verbose: true })
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
