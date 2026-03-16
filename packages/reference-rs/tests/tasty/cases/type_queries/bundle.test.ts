/**
 * Vitest tests for the type_queries scenario bundle.
 * Asserts structural TypeRef emission for typeof-based type queries.
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

describe('type_queries bundle', () => {
  it('has expected symbols', async () => {
    const mod = await loadBundle()
    const symbols = getSymbols(mod)
    const names = symbols.map((s) => s.name)
    expect(names).toContain('ThemeConfig')
    expect(names).toContain('SpacingScale')
    expect(names).toContain('WithTypeQueries')
  })

  it('emits typeof identifier as a structured type query', async () => {
    const mod = await loadBundle()
    const symbols = getSymbols(mod)
    const themeConfig = findSymbol(symbols, 'ThemeConfig')
    const def = themeConfig.definition as { kind?: string; expression?: string }
    expect(def.kind).toBe('type_query')
    expect(def.expression).toBe('themeConfig')
  })

  it('emits typeof qualified access as a structured type query', async () => {
    const mod = await loadBundle()
    const symbols = getSymbols(mod)
    const spacingScale = findSymbol(symbols, 'SpacingScale')
    const def = spacingScale.definition as { kind?: string; expression?: string }
    expect(def.kind).toBe('type_query')
    expect(def.expression).toBe('tokens.spacing')
  })

  it('emits member types that use type queries structurally', async () => {
    const mod = await loadBundle()
    const symbols = getSymbols(mod)
    const withTypeQueries = findSymbol(symbols, 'WithTypeQueries')
    const configMember = withTypeQueries.members?.find((m) => m.name === 'config')
    const spacingMember = withTypeQueries.members?.find((m) => m.name === 'spacing')

    expect(configMember).toBeDefined()
    expect((configMember!.type as { kind?: string }).kind).toBe('type_query')
    expect((configMember!.type as { expression?: string }).expression).toBe('themeConfig')

    expect(spacingMember).toBeDefined()
    expect((spacingMember!.type as { kind?: string }).kind).toBe('type_query')
    expect((spacingMember!.type as { expression?: string }).expression).toBe('tokens.spacing')
  })
})
