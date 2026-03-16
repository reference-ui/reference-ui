/**
 * Vitest tests for the template_literals scenario bundle.
 * Asserts structural TypeRef emission for template literal types.
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
    definition?: unknown
    members?: Array<{ name: string; type?: unknown }>
  }>
}

function findSymbol(symbols: ReturnType<typeof getSymbols>, name: string) {
  const symbol = symbols.find((s) => s.name === name)
  if (!symbol) throw new Error(`Symbol not found: ${name}`)
  return symbol
}

describe('template_literals bundle', () => {
  it('has expected symbols', async () => {
    const mod = await loadBundle('template_literals')
    const symbols = getSymbols(mod)
    const names = symbols.map((s) => s.name)
    expect(names).toContain('Tokens')
    expect(names).toContain('SizeVariant')
    expect(names).toContain('TokenKeyLabel')
    expect(names).toContain('WithTemplateLiterals')
  })

  it('emits union interpolation as template literal parts', async () => {
    const mod = await loadBundle('template_literals')
    const symbols = getSymbols(mod)
    const sizeVariant = findSymbol(symbols, 'SizeVariant')
    const def = sizeVariant.definition as {
      kind?: string
      parts?: Array<{ kind?: string; value?: unknown }>
    }
    expect(def.kind).toBe('template_literal')
    expect(def.parts?.length).toBe(3)
    expect(def.parts?.[0]).toEqual({ kind: 'text', value: 'size-' })
    const typePart = def.parts?.[1] as { kind?: string; value?: { kind?: string; types?: unknown[] } }
    expect(typePart.kind).toBe('type')
    expect(typePart.value?.kind).toBe('union')
    expect(typePart.value?.types?.length).toBe(2)
    expect(def.parts?.[2]).toEqual({ kind: 'text', value: '' })
  })

  it('emits nested structured types inside template literal parts', async () => {
    const mod = await loadBundle('template_literals')
    const symbols = getSymbols(mod)
    const tokenKeyLabel = findSymbol(symbols, 'TokenKeyLabel')
    const def = tokenKeyLabel.definition as {
      kind?: string
      parts?: Array<{ kind?: string; value?: unknown }>
    }
    expect(def.kind).toBe('template_literal')
    expect(def.parts?.[0]).toEqual({ kind: 'text', value: 'token-' })
    const typePart = def.parts?.[1] as {
      kind?: string
      value?: { kind?: string; operator?: string; target?: { name?: string } }
    }
    expect(typePart.kind).toBe('type')
    expect(typePart.value?.kind).toBe('type_operator')
    expect(typePart.value?.operator).toBe('keyof')
    expect(typePart.value?.target?.name).toBe('Tokens')
  })

  it('emits member types that use template literals structurally', async () => {
    const mod = await loadBundle('template_literals')
    const symbols = getSymbols(mod)
    const withTemplateLiterals = findSymbol(symbols, 'WithTemplateLiterals')
    const sizeMember = withTemplateLiterals.members?.find((m) => m.name === 'size')
    const labelMember = withTemplateLiterals.members?.find((m) => m.name === 'label')

    expect(sizeMember).toBeDefined()
    expect((sizeMember!.type as { kind?: string }).kind).toBe('template_literal')

    expect(labelMember).toBeDefined()
    expect((labelMember!.type as { kind?: string }).kind).toBe('template_literal')
    const parts = (labelMember!.type as { parts?: Array<{ kind?: string; value?: unknown }> }).parts
    const nested = parts?.[1] as {
      value?: { kind?: string; operator?: string }
    }
    expect(nested.value?.kind).toBe('type_operator')
    expect(nested.value?.operator).toBe('keyof')
  })
})
