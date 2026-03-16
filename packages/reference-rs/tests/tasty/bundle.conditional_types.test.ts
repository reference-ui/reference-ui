/**
 * Vitest tests for the conditional_types scenario bundle.
 * Asserts structural TypeRef emission for conditional types.
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

describe('conditional_types bundle', () => {
  it('has expected symbols', async () => {
    const mod = await loadBundle('conditional_types')
    const symbols = getSymbols(mod)
    const names = symbols.map((s) => s.name)
    expect(names).toContain('User')
    expect(names).toContain('IsString')
    expect(names).toContain('ToUser')
    expect(names).toContain('WithConditionals')
  })

  it('emits simple conditional aliases structurally', async () => {
    const mod = await loadBundle('conditional_types')
    const symbols = getSymbols(mod)
    const isString = findSymbol(symbols, 'IsString')
    const def = isString.definition as {
      kind?: string
      checkType?: { name?: string }
      extendsType?: { kind?: string; name?: string }
      trueType?: { kind?: string; value?: string }
      falseType?: { kind?: string; value?: string }
    }
    expect(def.kind).toBe('conditional')
    expect(def.checkType?.name).toBe('T')
    expect(def.extendsType?.kind).toBe('intrinsic')
    expect(def.extendsType?.name).toBe('string')
    expect(def.trueType?.kind).toBe('literal')
    expect(def.trueType?.value).toBe("'yes'")
    expect(def.falseType?.kind).toBe('literal')
    expect(def.falseType?.value).toBe("'no'")
  })

  it('emits referenced branches inside conditionals', async () => {
    const mod = await loadBundle('conditional_types')
    const symbols = getSymbols(mod)
    const toUser = findSymbol(symbols, 'ToUser')
    const def = toUser.definition as {
      kind?: string
      trueType?: { name?: string; library?: string }
      falseType?: { kind?: string; name?: string }
    }
    expect(def.kind).toBe('conditional')
    expect(def.trueType?.name).toBe('User')
    expect(def.trueType?.library).toBe('user')
    expect(def.falseType?.kind).toBe('intrinsic')
    expect(def.falseType?.name).toBe('never')
  })

  it('emits member types that use conditionals structurally', async () => {
    const mod = await loadBundle('conditional_types')
    const symbols = getSymbols(mod)
    const withConditionals = findSymbol(symbols, 'WithConditionals')
    const resultMember = withConditionals.members?.find((m) => m.name === 'result')
    const userishMember = withConditionals.members?.find((m) => m.name === 'userish')

    expect(resultMember).toBeDefined()
    expect((resultMember!.type as { kind?: string }).kind).toBe('conditional')

    expect(userishMember).toBeDefined()
    expect((userishMember!.type as { kind?: string }).kind).toBe('conditional')
    expect(
      ((userishMember!.type as { trueType?: { name?: string } }).trueType?.name)
    ).toBe('User')
  })
})
