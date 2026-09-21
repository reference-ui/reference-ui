// Byte-exact accounting for the shipped runtime-data.mjs.
// It takes the module text, splits the fixed export envelope from the JSON
// blob, and attributes every blob byte to top-level tables by re-serialization.
// JSON key order and compact separators round-trip (asserted), so each entry
// costs `"key":` + value + its comma share, and the parts sum to the blob.
// Recipes break down per entry and per field across all entries. Residual must be zero.

export interface JsonEntryAccount {
  key: string
  bytes: number
  valueBytes: number
  keyBytes: number
}

export interface RecipeFieldTotals {
  field: string
  bytes: number
}

export interface RecipeAccount {
  entries: number
  bytes: number
  fields: RecipeFieldTotals[]
  largest: { key: string; bytes: number }[]
}

export interface DataAccount {
  bytes: number
  headerBytes: number
  systemNameBytes: number
  envelopeBytes: number
  blobBytes: number
  tables: JsonEntryAccount[]
  punctBytes: number
  namer: JsonEntryAccount[]
  recipes: RecipeAccount
  stylePropNamesBytes: number
  accounted: number
  residual: number
}

export interface DataEnvelope {
  headerLine: string
  systemNameLine: string
  prefix: string
  blob: string
  suffix: string
}

const RUNTIME_PREFIX = 'export const runtimeData = '

function blen(text: string): number {
  return Buffer.byteLength(text, 'utf-8')
}

function splitEnvelope(text: string): DataEnvelope {
  const firstNl = text.indexOf('\n')
  if (firstNl === -1) throw new Error('runtime-data.mjs has no header line')
  const headerLine = text.slice(0, firstNl + 1)
  const secondNl = text.indexOf('\n', firstNl + 1)
  if (secondNl === -1) throw new Error('runtime-data.mjs has no systemName line')
  const systemNameLine = text.slice(firstNl + 1, secondNl + 1)
  const rest = text.slice(secondNl + 1)
  if (!rest.startsWith(RUNTIME_PREFIX)) throw new Error('runtime-data.mjs lost its runtimeData export')
  if (!rest.endsWith('\n')) throw new Error('runtime-data.mjs lost its trailing newline')
  const blob = rest.slice(RUNTIME_PREFIX.length, rest.length - 1)
  return { headerLine, systemNameLine, prefix: RUNTIME_PREFIX, blob, suffix: '\n' }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function accountObject(obj: Record<string, unknown>): { entries: JsonEntryAccount[]; punct: number } {
  const keys = Object.keys(obj)
  const entries = keys.map((key) => {
    const keyBytes = blen(JSON.stringify(key)) + 1
    const valueBytes = blen(JSON.stringify(obj[key]))
    return { key, bytes: keyBytes + valueBytes, valueBytes, keyBytes }
  })
  const commas = keys.length > 0 ? keys.length - 1 : 0
  const punct = 2 + commas
  return { entries, punct }
}

function verifyRoundTrip(parsed: unknown, blob: string): void {
  const rebuilt = JSON.stringify(parsed)
  if (rebuilt !== blob) {
    throw new Error(`runtime-data blob does not round-trip (blob ${blob.length}, rebuilt ${rebuilt.length})`)
  }
}

export function accountRuntimeData(text: string): DataAccount {
  const envelope = splitEnvelope(text)
  const parsed: unknown = JSON.parse(envelope.blob)
  verifyRoundTrip(parsed, envelope.blob)
  if (!isRecord(parsed)) throw new Error('runtimeData blob is not an object')
  const { entries: tables, punct } = accountObject(parsed)
  const tableBytes = tables.reduce((n, t) => n + t.bytes, 0)
  const blobBytes = blen(envelope.blob)
  if (1 + tableBytes + (tables.length > 0 ? tables.length - 1 : 0) + 1 !== blobBytes) {
    throw new Error('table bytes do not reconcile to the blob')
  }
  const namerRaw = parsed['namer']
  const namer = isRecord(namerRaw) ? accountObject(namerRaw).entries : []
  const recipesRaw = parsed['recipes']
  const recipes = accountRecipes(isRecord(recipesRaw) ? recipesRaw : {})
  const stylePropNamesBytes = tables.find((t) => t.key === 'stylePropNames')?.bytes ?? 0
  const headerBytes = blen(envelope.headerLine)
  const systemNameBytes = blen(envelope.systemNameLine)
  const envelopeBytes = headerBytes + systemNameBytes + blen(envelope.prefix) + blen(envelope.suffix)
  const accounted = envelopeBytes + blobBytes
  return {
    bytes: blen(text),
    headerBytes,
    systemNameBytes,
    envelopeBytes,
    blobBytes,
    tables,
    punctBytes: punct,
    namer,
    recipes,
    stylePropNamesBytes,
    accounted,
    residual: blen(text) - accounted,
  }
}

function accountRecipes(recipes: Record<string, unknown>): RecipeAccount {
  const fieldTotals = new Map<string, number>()
  const sizes: { key: string; bytes: number }[] = []
  let bodyBytes = 0
  const keys = Object.keys(recipes)
  for (const key of keys) {
    const value = recipes[key]
    const keyBytes = blen(JSON.stringify(key)) + 1
    const valueBytes = blen(JSON.stringify(value))
    bodyBytes += keyBytes + valueBytes
    sizes.push({ key, bytes: keyBytes + valueBytes })
    if (isRecord(value)) {
      for (const field of Object.keys(value)) {
        const fieldBytes = blen(JSON.stringify(field)) + 1 + blen(JSON.stringify(value[field]))
        fieldTotals.set(field, (fieldTotals.get(field) ?? 0) + fieldBytes)
      }
      const fieldKeys = Object.keys(value).length
      const fieldPunct = 2 + (fieldKeys > 0 ? fieldKeys - 1 : 0)
      fieldTotals.set('(punct)', (fieldTotals.get('(punct)') ?? 0) + fieldPunct)
    }
  }
  const bytes = 2 + bodyBytes + (keys.length > 0 ? keys.length - 1 : 0)
  sizes.sort((a, b) => b.bytes - a.bytes)
  const fields = [...fieldTotals.entries()]
    .map(([field, fieldBytes]) => ({ field, bytes: fieldBytes }))
    .sort((a, b) => b.bytes - a.bytes)
  return { entries: keys.length, bytes, fields, largest: sizes.slice(0, 5) }
}
