/**
 * Vitest tests for the type_operators scenario bundle.
 * Asserts structural TypeRef emission for keyof, readonly, and unique symbol.
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

describe('type_operators bundle', () => {
  it('has expected symbols', async () => {
    const mod = await loadBundle()
    const symbols = getSymbols(mod)
    const names = symbols.map((s) => s.name)
    expect(names).toContain('User')
    expect(names).toContain('KeysOfUser')
    expect(names).toContain('ReadonlyUsers')
    expect(names).toContain('WithOperators')
  })

  it('emits keyof as a structured type operator', async () => {
    const mod = await loadBundle()
    const symbols = getSymbols(mod)
    const keysOfUser = findSymbol(symbols, 'KeysOfUser')
    const def = keysOfUser.definition as {
      kind?: string
      operator?: string
      target?: { name?: string; library?: string }
    }
    expect(def.kind).toBe('type_operator')
    expect(def.operator).toBe('keyof')
    expect(def.target?.name).toBe('User')
    expect(def.target?.library).toBe('user')
  })

  it('emits readonly as a structured type operator around arrays', async () => {
    const mod = await loadBundle()
    const symbols = getSymbols(mod)
    const readonlyUsers = findSymbol(symbols, 'ReadonlyUsers')
    const def = readonlyUsers.definition as {
      kind?: string
      operator?: string
      target?: { kind?: string; element?: { name?: string; library?: string } }
    }
    expect(def.kind).toBe('type_operator')
    expect(def.operator).toBe('readonly')
    expect(def.target?.kind).toBe('array')
    expect(def.target?.element?.name).toBe('User')
    expect(def.target?.element?.library).toBe('user')
  })

  it('emits member types that use operators structurally', async () => {
    const mod = await loadBundle()
    const symbols = getSymbols(mod)
    const withOperators = findSymbol(symbols, 'WithOperators')
    const keyMember = withOperators.members?.find((m) => m.name === 'key')
    const frozenUsersMember = withOperators.members?.find((m) => m.name === 'frozenUsers')
    const tokenMember = withOperators.members?.find((m) => m.name === 'token')

    expect(keyMember).toBeDefined()
    expect((keyMember!.type as { kind?: string; operator?: string }).kind).toBe('type_operator')
    expect((keyMember!.type as { operator?: string }).operator).toBe('keyof')

    expect(frozenUsersMember).toBeDefined()
    expect(
      (frozenUsersMember!.type as { kind?: string; operator?: string }).kind
    ).toBe('type_operator')
    expect((frozenUsersMember!.type as { operator?: string }).operator).toBe('readonly')

    expect(tokenMember).toBeDefined()
    expect((tokenMember!.type as { kind?: string; operator?: string }).kind).toBe('type_operator')
    expect((tokenMember!.type as { operator?: string }).operator).toBe('unique')
    expect((tokenMember!.type as { target?: { kind?: string; name?: string } }).target?.kind).toBe(
      'intrinsic'
    )
    expect((tokenMember!.type as { target?: { name?: string } }).target?.name).toBe('symbol')
  })
})
