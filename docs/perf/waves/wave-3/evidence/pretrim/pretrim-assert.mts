import { strict as assert } from 'node:assert'
import { searchEngine } from '/Users/ryn/Developer/reference-ui/.muse/worktrees/subagent-v2-01a0c878-de3e-7760-a325-72552d079c1f-01a0c891-7d82-7791-bcc3-1622ab314442/packages/reference-mcp/src/pipeline/icons-search-index.ts'
// Mirror of icons-catalog.ts exports (extensionless import unresolvable under strip-types)
const searchIcons = o => searchEngine.search(o)
const ICON_CATEGORIES = searchEngine.categories

let pass = 0
const t = (name, fn) => { fn(); pass++; console.log('ok -', name) }

t('guidance when no query', () => {
  const r = searchIcons()
  assert.ok(r.totalAvailable > 3000)
  assert.equal(r.total, 0); assert.equal(r.returned, 0); assert.deepEqual(r.icons, [])
  assert.ok(r.message.includes('3,800+ Material Symbols React icons'))
  assert.ok(['action', 'navigation', 'editor'].every(c => r.categories.includes(c)))
  assert.ok(r.examples)
})
t('trash -> DeleteIcon lean', () => {
  const r = searchIcons({ query: 'trash' })
  assert.ok(r.total > 0); assert.equal(r.icons[0]?.name, 'DeleteIcon')
  assert.ok(r.icons[0]?.description.includes('Delete'))
  assert.equal(r.icons[0]?.import, undefined); assert.equal(r.icons[0]?.example, undefined)
})
t('verbose', () => {
  const r = searchIcons({ query: 'trash', verbose: true })
  assert.equal(r.icons[0]?.name, 'DeleteIcon')
  assert.equal(r.icons[0]?.import, "import { DeleteIcon } from '@reference-ui/icons'")
  assert.ok(r.icons[0]?.example.includes('<DeleteIcon size="md"'))
  assert.equal(r.icons[0]?.category, 'action')
})
t('magnifying glass -> SearchIcon', () => {
  const r = searchIcons({ query: 'magnifying glass' })
  assert.ok(r.icons.map(i => i.name).includes('SearchIcon'))
})
t('pencil -> EditIcon', () => {
  assert.equal(searchIcons({ query: 'pencil' }).icons[0]?.name, 'EditIcon')
})
t('cross -> CloseIcon', () => {
  assert.equal(searchIcons({ query: 'cross' }).icons[0]?.name, 'CloseIcon')
})
t('seach -> SearchIcon', () => {
  assert.equal(searchIcons({ query: 'seach' }).icons[0]?.name, 'SearchIcon')
})
t('setings -> SettingsIcon', () => {
  assert.equal(searchIcons({ query: 'setings' }).icons[0]?.name, 'SettingsIcon')
})
t('multi-demand sentence', () => {
  const r = searchIcons({ query: 'I need an icon for user settings, a shopping cart, and a trash can for deletion' })
  assert.equal(r.totalDemands, 3); assert.equal(r.demands.length, 3)
  const names = r.icons.map(i => i.name)
  assert.ok(names.some(n => n.includes('Settings')) && names.some(n => n.includes('Cart')) && names.some(n => n.includes('Delete')))
})
t('batch demands', () => {
  const r = searchIcons({ demands: ['shopping cart', 'trash', 'gear'] })
  assert.equal(r.totalDemands, 3); assert.equal(r.demands.length, 3)
  assert.equal(r.demands[0].demand, 'shopping cart')
  assert.ok(r.demands[0].icons.some(i => i.name === 'ShoppingCartIcon'))
  assert.ok(r.demands[1].icons.some(i => i.name === 'DeleteIcon'))
  assert.ok(r.demands[2].icons.some(i => i.name === 'SettingsIcon'))
})
t('category filter', () => {
  const r = searchIcons({ category: 'navigation', limit: 10, verbose: true })
  assert.equal(r.returned, 10)
  assert.ok(r.icons.every(i => i.category === 'navigation'))
})
t('limit', () => {
  const r = searchIcons({ query: 'arrow', limit: 5 })
  assert.ok(r.total > 5); assert.equal(r.returned, 5); assert.equal(r.icons.length, 5)
})
console.log(`ALL ${pass}/12 assertions passed`)
