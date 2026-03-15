/**
 * Vitest tests for the signatures scenario bundle.
 * Asserts §4.2 (richer type refs: array, tuple, intersection) and §4.3 (member metadata: readonly, kind).
 */
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function loadBundle(scenario: string) {
  const bundlePath = join(__dirname, 'output', scenario, 'bundle.js')
  return import(pathToFileURL(bundlePath).href)
}

function getSymbols(mod: Record<string, unknown>) {
  return Object.values(mod).filter(
    (v): v is Record<string, unknown> =>
      v !== null &&
      typeof v === 'object' &&
      'name' in v &&
      'library' in v &&
      'id' in v
  ) as Array<{
    id: string
    name: string
    library: string
    members?: Array<{
      name: string
      kind?: string
      readonly?: boolean
      type?: unknown
    }>
    definition?: unknown
  }>
}

function findSymbol(
  symbols: ReturnType<typeof getSymbols>,
  name: string
) {
  const s = symbols.find((s) => s.name === name)
  if (!s) throw new Error(`Symbol not found: ${name}`)
  return s
}

describe('signatures bundle', () => {
  it('exports interfaces and types arrays', async () => {
    const mod = await loadBundle('signatures')
    expect(mod.interfaces).toBeDefined()
    expect(Array.isArray(mod.interfaces)).toBe(true)
    expect(mod.types).toBeDefined()
    expect(Array.isArray(mod.types)).toBe(true)
  })

  it('has expected symbols', async () => {
    const mod = await loadBundle('signatures')
    const symbols = getSymbols(mod)
    const names = symbols.map((s) => s.name)
    expect(names).toContain('ReadonlyProps')
    expect(names).toContain('WithMethod')
    expect(names).toContain('Callable')
    expect(names).toContain('StringMap')
    expect(names).toContain('MixedMembers')
    expect(names).toContain('StringArray')
    expect(names).toContain('NumberArray')
    expect(names).toContain('StringNumberPair')
    expect(names).toContain('WithIdAndName')
    expect(names).toContain('Pairs')
  })

  it('emits readonly and kind on members (ReadonlyProps)', async () => {
    const mod = await loadBundle('signatures')
    const symbols = getSymbols(mod)
    const readonlyProps = findSymbol(symbols, 'ReadonlyProps')
    expect(readonlyProps.members).toBeDefined()
    const idMember = readonlyProps.members!.find((m) => m.name === 'id')
    const labelMember = readonlyProps.members!.find((m) => m.name === 'label')
    expect(idMember).toBeDefined()
    expect(idMember!.readonly).toBe(true)
    expect(idMember!.kind).toBe('property')
    expect(labelMember).toBeDefined()
    expect(labelMember!.readonly).toBe(false)
    expect(labelMember!.kind).toBe('property')
  })

  it('emits method signature with kind "method" (WithMethod)', async () => {
    const mod = await loadBundle('signatures')
    const symbols = getSymbols(mod)
    const withMethod = findSymbol(symbols, 'WithMethod')
    const getNameMember = withMethod.members!.find((m) => m.name === 'getName')
    expect(getNameMember).toBeDefined()
    expect(getNameMember!.kind).toBe('method')
  })

  it('emits call signature as [call] with kind "call" (Callable)', async () => {
    const mod = await loadBundle('signatures')
    const symbols = getSymbols(mod)
    const callable = findSymbol(symbols, 'Callable')
    const callMember = callable.members!.find((m) => m.name === '[call]')
    expect(callMember).toBeDefined()
    expect(callMember!.kind).toBe('call')
  })

  it('emits index signature as [index] with kind "index" (StringMap)', async () => {
    const mod = await loadBundle('signatures')
    const symbols = getSymbols(mod)
    const stringMap = findSymbol(symbols, 'StringMap')
    const indexMember = stringMap.members!.find((m) => m.name === '[index]')
    expect(indexMember).toBeDefined()
    expect(indexMember!.kind).toBe('index')
  })

  it('emits array type (StringArray, NumberArray)', async () => {
    const mod = await loadBundle('signatures')
    const symbols = getSymbols(mod)
    const stringArray = findSymbol(symbols, 'StringArray')
    expect(stringArray.definition).toBeDefined()
    const def = stringArray.definition as { kind?: string; element?: unknown }
    expect(def.kind).toBe('array')
    expect(def.element).toBeDefined()

    const numberArray = findSymbol(symbols, 'NumberArray')
    const numDef = numberArray.definition as { kind?: string; element?: unknown }
    expect(numDef.kind).toBe('array')
  })

  it('emits tuple type (StringNumberPair)', async () => {
    const mod = await loadBundle('signatures')
    const symbols = getSymbols(mod)
    const pair = findSymbol(symbols, 'StringNumberPair')
    const def = pair.definition as { kind?: string; elements?: unknown[] }
    expect(def.kind).toBe('tuple')
    expect(Array.isArray(def.elements)).toBe(true)
    expect(def.elements!.length).toBe(2)
  })

  it('emits intersection type (WithIdAndName)', async () => {
    const mod = await loadBundle('signatures')
    const symbols = getSymbols(mod)
    const withIdAndName = findSymbol(symbols, 'WithIdAndName')
    const def = withIdAndName.definition as { kind?: string; types?: unknown[] }
    expect(def.kind).toBe('intersection')
    expect(Array.isArray(def.types)).toBe(true)
    expect(def.types!.length).toBeGreaterThanOrEqual(1)
  })
})
