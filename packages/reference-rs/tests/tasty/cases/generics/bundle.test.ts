/**
 * Vitest tests for the generics scenario bundle.
 * Asserts that type parameters and type arguments are captured and emitted.
 * Bundles are emitted by globalSetup using the compiled napi-rs runtime (scanAndEmitBundle).
 */
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function loadBundle() {
  const bundlePath = join(__dirname, 'output', 'bundle.js')
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
    typeParameters?: Array<{ name: string; constraint?: unknown; default?: unknown }>
    members?: Array<{ name: string; description?: string; type?: unknown }>
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

describe('generics bundle', () => {
  it('exports interfaces and types arrays', async () => {
    const mod = await loadBundle()
    expect(mod.interfaces).toBeDefined()
    expect(Array.isArray(mod.interfaces)).toBe(true)
    expect(mod.types).toBeDefined()
    expect(Array.isArray(mod.types)).toBe(true)
  })

  it('has expected symbols including generic types', async () => {
    const mod = await loadBundle()
    const symbols = getSymbols(mod)
    const names = symbols.map((s) => s.name)
    expect(names).toContain('Box')
    expect(names).toContain('Props')
    expect(names).toContain('ComponentProps')
    expect(names).toContain('WithGenerics')
    expect(names).toContain('UsesGenericRef')
  })

  it('emits typeParameters on generic type alias (Box<T>)', async () => {
    const mod = await loadBundle()
    const symbols = getSymbols(mod)
    const box = findSymbol(symbols, 'Box')
    expect(box.typeParameters).toBeDefined()
    expect(box.typeParameters).toHaveLength(1)
    expect(box.typeParameters![0].name).toBe('T')
    expect(box.typeParameters![0].constraint).toBeUndefined()
    expect(box.typeParameters![0].default).toBeUndefined()
  })

  it('emits typeParameters with constraint on interface (Props<T extends object>)', async () => {
    const mod = await loadBundle()
    const symbols = getSymbols(mod)
    const props = findSymbol(symbols, 'Props')
    expect(props.typeParameters).toBeDefined()
    expect(props.typeParameters).toHaveLength(1)
    expect(props.typeParameters![0].name).toBe('T')
    expect(props.typeParameters![0].constraint).toMatchObject({
      kind: 'intrinsic',
      name: 'object',
    })
  })

  it('emits multiple typeParameters (WithGenerics<T, U>)', async () => {
    const mod = await loadBundle()
    const symbols = getSymbols(mod)
    const withGenerics = findSymbol(symbols, 'WithGenerics')
    expect(withGenerics.typeParameters).toBeDefined()
    expect(withGenerics.typeParameters).toHaveLength(2)
    expect(withGenerics.typeParameters!.map((p) => p.name)).toEqual(['T', 'U'])
  })

  it('emits typeArguments on member type (Props<Box<string>>)', async () => {
    const mod = await loadBundle()
    const symbols = getSymbols(mod)
    const usesRef = findSymbol(symbols, 'UsesGenericRef')
    expect(usesRef.members).toBeDefined()
    const itemMember = usesRef.members!.find((m) => m.name === 'item')
    expect(itemMember).toBeDefined()
    expect(itemMember!.type).toBeDefined()
    const typeObj = itemMember!.type as { typeArguments?: unknown[] }
    expect(typeObj.typeArguments).toBeDefined()
    expect(Array.isArray(typeObj.typeArguments)).toBe(true)
    expect(typeObj.typeArguments!.length).toBeGreaterThan(0)
  })

  it('emits Box definition as object type with members (not unknown)', async () => {
    const mod = await loadBundle()
    const symbols = getSymbols(mod)
    const box = findSymbol(symbols, 'Box')
    expect(box.definition).toBeDefined()
    const def = box.definition as { kind?: string; members?: Array<{ name: string }> }
    expect(def.kind).toBe('object')
    expect(def.members).toBeDefined()
    expect(def.members).toHaveLength(1)
    expect(def.members![0].name).toBe('value')
  })

  it('emits member-specific descriptions (not interface leading comment)', async () => {
    const mod = await loadBundle()
    const symbols = getSymbols(mod)
    const usesRef = findSymbol(symbols, 'UsesGenericRef')
    const itemMember = usesRef.members!.find((m) => m.name === 'item')
    expect(itemMember!.description).toBe('The wrapped Props<Box<string>> instance.')

    const withGenerics = findSymbol(symbols, 'WithGenerics')
    const aMember = withGenerics.members!.find((m) => m.name === 'a')
    const bMember = withGenerics.members!.find((m) => m.name === 'b')
    expect(aMember!.description).toBe('First generic field.')
    expect(bMember!.description).toBe('Second generic field.')
  })

  it('emits libraries array including user', async () => {
    const mod = await loadBundle()
    expect(mod.libraries).toBeDefined()
    expect(Array.isArray(mod.libraries)).toBe(true)
    expect(mod.libraries).toContain('user')
  })
})
