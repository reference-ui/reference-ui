/**
 * Vitest tests for the unions_literals scenario bundle.
 * Asserts TypeRef::Union, TypeRef::Literal, and optional members.
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
    definition?: { kind?: string; types?: unknown[]; value?: unknown }
    members?: Array<{ name: string; optional?: boolean; type?: unknown }>
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

describe('unions_literals bundle', () => {
  it('exports interfaces and types arrays', async () => {
    const mod = await loadBundle('unions_literals')
    expect(mod.interfaces).toBeDefined()
    expect(Array.isArray(mod.interfaces)).toBe(true)
    expect(mod.types).toBeDefined()
    expect(Array.isArray(mod.types)).toBe(true)
  })

  it('has expected symbols', async () => {
    const mod = await loadBundle('unions_literals')
    const symbols = getSymbols(mod)
    const names = symbols.map((s) => s.name)
    expect(names).toContain('Status')
    expect(names).toContain('LogLevel')
    expect(names).toContain('StringOrNumber')
    expect(names).toContain('MaybeId')
    expect(names).toContain('OptionalProps')
    expect(names).toContain('ButtonVariant')
  })

  it('emits union type definition (Status: string literals)', async () => {
    const mod = await loadBundle('unions_literals')
    const symbols = getSymbols(mod)
    const status = findSymbol(symbols, 'Status')
    expect(status.definition).toBeDefined()
    const def = status.definition as { kind?: string; types?: unknown[] }
    expect(def.kind).toBe('union')
    expect(Array.isArray(def.types)).toBe(true)
    expect(def.types!.length).toBeGreaterThanOrEqual(2)
  })

  it('emits union type (StringOrNumber: string | number)', async () => {
    const mod = await loadBundle('unions_literals')
    const symbols = getSymbols(mod)
    const stringOrNumber = findSymbol(symbols, 'StringOrNumber')
    const def = stringOrNumber.definition as { kind?: string; types?: unknown[] }
    expect(def.kind).toBe('union')
    expect(def.types!.length).toBe(2)
  })

  it('emits literal in type ref when present', async () => {
    const mod = await loadBundle('unions_literals')
    const symbols = getSymbols(mod)
    const status = findSymbol(symbols, 'Status')
    const def = status.definition as { kind?: string; types?: Array<{ kind?: string; value?: string }> }
    const hasLiteral = def.types?.some((t) => (t as { kind?: string }).kind === 'literal')
    expect(hasLiteral).toBe(true)
  })

  it('emits optional: true for optional members (OptionalProps)', async () => {
    const mod = await loadBundle('unions_literals')
    const symbols = getSymbols(mod)
    const optionalProps = findSymbol(symbols, 'OptionalProps')
    expect(optionalProps.members).toBeDefined()
    const nameMember = optionalProps.members!.find((m) => m.name === 'name')
    const descMember = optionalProps.members!.find((m) => m.name === 'description')
    const countMember = optionalProps.members!.find((m) => m.name === 'count')
    expect(nameMember).toBeDefined()
    expect(nameMember!.optional).toBe(false)
    expect(descMember).toBeDefined()
    expect(descMember!.optional).toBe(true)
    expect(countMember).toBeDefined()
    expect(countMember!.optional).toBe(true)
  })

  it('emits libraries array including user', async () => {
    const mod = await loadBundle('unions_literals')
    expect(mod.libraries).toBeDefined()
    expect(mod.libraries).toContain('user')
  })
})
