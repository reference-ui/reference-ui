import { readFile, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import MiniSearch from 'minisearch'

const here = dirname(fileURLToPath(import.meta.url))
const metadataPath = join(here, '../src/data/icons-metadata.json')
const targetIndexPath = join(here, '../src/data/icons-index.json')

export const PRIMARY_SYNONYMS = {
  edit: 'pencil pen modify write update',
  delete: 'trash bin garbage rubbish remove erase discard',
  search: 'magnifying glass find lookup query explore',
  close: 'cross dismiss cancel exit x',
  settings: 'gear cog preferences config setup',
  check: 'tick done success verified ok',
  person: 'user profile avatar account',
  shopping_cart: 'cart basket checkout ecommerce shopping cart',
  home: 'house main landing',
  favorite: 'heart like love bookmark',
  visibility: 'eye view show preview reveal',
  visibility_off: 'eye closed hide conceal blind',
  notifications: 'bell alert chime reminder',
}

export const MINI_SEARCH_CONFIG = {
  fields: ['canonical', 'name', 'slug', 'primarySynonyms', 'tags', 'description'],
  storeFields: ['name', 'description', 'categories'],
  searchOptions: {
    boost: {
      canonical: 30,
      primarySynonyms: 15,
      name: 8,
      slug: 6,
      tags: 3,
      description: 1,
    },
    fuzzy: term => (term.length > 3 ? 0.2 : false),
    prefix: true,
  },
}

async function main() {
  const t0 = performance.now()
  console.log(`[build-icons-index] Reading icon metadata from ${metadataPath}...`)
  const rawText = await readFile(metadataPath, 'utf8')
  const metadata = JSON.parse(rawText)

  const entries = Object.values(metadata)
  console.log(`[build-icons-index] Loaded ${entries.length} icons. Compiling MiniSearch index...`)

  const ms = new MiniSearch({
    fields: MINI_SEARCH_CONFIG.fields,
    storeFields: MINI_SEARCH_CONFIG.storeFields,
    searchOptions: MINI_SEARCH_CONFIG.searchOptions,
  })

  const docs = []
  let id = 1
  for (const item of entries) {
    const name = item.name
    const slug = (item.slug || '').toLowerCase()
    const rawName = name.replace(/Icon$/, '').toLowerCase()
    const primarySyn = PRIMARY_SYNONYMS[slug] || PRIMARY_SYNONYMS[rawName] || ''

    // Distinguish base/primary icons (e.g. DeleteIcon vs DeleteForeverIcon)
    const isBase = !name.replace(/Icon$/, '').match(/[A-Z].*[A-Z]/)
    const canonical = isBase ? `${rawName} ${slug} ${primarySyn}` : ''

    docs.push({
      id: id++,
      canonical,
      name,
      slug: slug.replace(/_/g, ' '),
      primarySynonyms: primarySyn,
      tags: (item.tags || []).join(' '),
      description: item.description || '',
      categories: item.categories || ['general'],
    })
  }

  ms.addAll(docs)

  // Serialize MiniSearch index
  const serialized = JSON.stringify(ms)
  await writeFile(targetIndexPath, serialized, 'utf8')

  const elapsed = (performance.now() - t0).toFixed(2)
  const sizeMb = (serialized.length / (1024 * 1024)).toFixed(2)
  console.log(
    `[build-icons-index] Successfully indexed ${docs.length} icons into ${targetIndexPath} (${sizeMb} MB) using MiniSearch in ${elapsed}ms`
  )
}

main().catch(err => {
  console.error('[build-icons-index] Error:', err)
  process.exit(1)
})
