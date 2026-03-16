/**
 * Vitest tests for the mapped_types scenario bundle.
 * Asserts structural TypeRef emission for mapped types.
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
    definition?: unknown
    members?: Array<{ name: string; type?: unknown }>
  }>
}

function findSymbol(symbols: ReturnType<typeof getSymbols>, name: string) {
  const symbol = symbols.find((s) => s.name === name)
  if (!symbol) throw new Error(`Symbol not found: ${name}`)
  return symbol
}

describe('mapped_types bundle', () => {
  it('has expected symbols', async () => {
    const mod = await loadBundle()
    const symbols = getSymbols(mod)
    const names = symbols.map((s) => s.name)
    expect(names).toContain('Tokens')
    expect(names).toContain('OptionalTokens')
    expect(names).toContain('TokenLabels')
    expect(names).toContain('WithMappedTypes')
  })

  it('emits mapped aliases with key binding, source type, modifiers, and value type', async () => {
    const mod = await loadBundle()
    const symbols = getSymbols(mod)
    const optionalTokens = findSymbol(symbols, 'OptionalTokens')
    const def = optionalTokens.definition as {
      kind?: string
      typeParam?: string
      sourceType?: { kind?: string; operator?: string; target?: { name?: string } }
      optionalModifier?: string
      readonlyModifier?: string
      valueType?: { kind?: string; object?: { name?: string }; index?: { name?: string } }
    }
    expect(def.kind).toBe('mapped')
    expect(def.typeParam).toBe('K')
    expect(def.sourceType?.kind).toBe('type_operator')
    expect(def.sourceType?.operator).toBe('keyof')
    expect(def.sourceType?.target?.name).toBe('T')
    expect(def.optionalModifier).toBe('add')
    expect(def.readonlyModifier).toBe('preserve')
    expect(def.valueType?.kind).toBe('indexed_access')
    expect(def.valueType?.object?.name).toBe('T')
    expect(def.valueType?.index?.name).toBe('K')
  })

  it('emits remapped keys and readonly modifier structurally', async () => {
    const mod = await loadBundle()
    const symbols = getSymbols(mod)
    const tokenLabels = findSymbol(symbols, 'TokenLabels')
    const def = tokenLabels.definition as {
      kind?: string
      readonlyModifier?: string
      nameType?: {
        kind?: string
        parts?: Array<{ kind?: string; value?: unknown }>
      }
    }
    expect(def.kind).toBe('mapped')
    expect(def.readonlyModifier).toBe('add')
    expect(def.nameType?.kind).toBe('template_literal')
    expect(def.nameType?.parts?.[0]).toEqual({ kind: 'text', value: 'token-' })
    expect(def.nameType?.parts?.[1]?.kind).toBe('type')
  })

  it('emits member types that use mapped types structurally', async () => {
    const mod = await loadBundle()
    const symbols = getSymbols(mod)
    const withMappedTypes = findSymbol(symbols, 'WithMappedTypes')
    const optionalMember = withMappedTypes.members?.find((m) => m.name === 'optional')
    const labelsMember = withMappedTypes.members?.find((m) => m.name === 'labels')

    expect(optionalMember).toBeDefined()
    expect((optionalMember!.type as { kind?: string }).kind).toBe('mapped')

    expect(labelsMember).toBeDefined()
    expect((labelsMember!.type as { kind?: string }).kind).toBe('mapped')
    expect(
      ((labelsMember!.type as { nameType?: { kind?: string } }).nameType?.kind)
    ).toBe('template_literal')
  })
})
