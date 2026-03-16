/**
 * Vitest tests for the unknown_complex scenario bundle.
 * Mapped and conditional types are structural.
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
    definition?: { kind?: string; summary?: string }
    members?: Array<{ name: string; type?: { kind?: string; summary?: string } }>
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

describe('unknown_complex bundle', () => {
  it('exports interfaces and types arrays', async () => {
    const mod = await loadBundle('unknown_complex')
    expect(mod.interfaces).toBeDefined()
    expect(mod.types).toBeDefined()
  })

  it('has expected symbols including User and UsesOptionalKeys', async () => {
    const mod = await loadBundle('unknown_complex')
    const symbols = getSymbols(mod)
    const names = symbols.map((s) => s.name)
    expect(names).toContain('User')
    expect(names).toContain('OptionalKeys')
    expect(names).toContain('StringKeys')
    expect(names).toContain('UsesOptionalKeys')
    expect(names).toContain('TemplateLiteralAlias')
    expect(names).toContain('TypeQueryAlias')
    expect(names).toContain('UserName')
    expect(names).toContain('WithIndexedAccess')
  })

  it('emits indexed access type (UserName = User["name"]) with object and index', async () => {
    const mod = await loadBundle('unknown_complex')
    const symbols = getSymbols(mod)
    const userName = findSymbol(symbols, 'UserName')
    const def = userName.definition as {
      kind?: string
      object?: { id?: string; name?: string; library?: string }
      index?: { kind?: string; value?: string }
    }
    expect(def.kind).toBe('indexed_access')
    expect(def.object).toBeDefined()
    expect(def.index).toBeDefined()
    expect(def.object!.name).toBe('User')
    expect(def.object!.library).toBe('user')
    expect(def.index!.kind).toBe('literal')
    expect(def.index!.value).toBeDefined()
  })

  it('emits member type as indexed access (WithIndexedAccess.nameType)', async () => {
    const mod = await loadBundle('unknown_complex')
    const symbols = getSymbols(mod)
    const withIdx = findSymbol(symbols, 'WithIndexedAccess')
    const nameTypeMember = withIdx.members!.find((m) => m.name === 'nameType')
    expect(nameTypeMember).toBeDefined()
    const typeRef = nameTypeMember!.type as { kind?: string; object?: { name?: string }; index?: unknown }
    expect(typeRef.kind).toBe('indexed_access')
    expect(typeRef.object).toBeDefined()
    expect(typeRef.object!.name).toBe('User')
  })

  it('emits template literal and type query structurally', async () => {
    const mod = await loadBundle('unknown_complex')
    const symbols = getSymbols(mod)
    const templateLiteral = findSymbol(symbols, 'TemplateLiteralAlias')
    const typeQuery = findSymbol(symbols, 'TypeQueryAlias')
    const def = (s: ReturnType<typeof findSymbol>) =>
      s.definition as {
        kind?: string
        summary?: string
        expression?: string
        parts?: Array<{ kind?: string; value?: unknown }>
      }
    expect(def(templateLiteral).kind).toBe('template_literal')
    expect(Array.isArray(def(templateLiteral).parts)).toBe(true)
    expect(def(templateLiteral).parts?.length).toBe(3)
    expect(def(templateLiteral).parts?.[0]?.kind).toBe('text')
    expect(def(templateLiteral).parts?.[1]?.kind).toBe('type')
    expect(def(templateLiteral).parts?.[2]).toEqual({ kind: 'text', value: '' })
    expect(def(typeQuery).kind).toBe('type_query')
    expect(def(typeQuery).expression).toBe('Array.prototype.map')
  })

  it('User interface has normal member types', async () => {
    const mod = await loadBundle('unknown_complex')
    const symbols = getSymbols(mod)
    const user = findSymbol(symbols, 'User')
    expect(user.members).toBeDefined()
    const idMember = user.members!.find((m) => m.name === 'id')
    expect(idMember?.type).toBeDefined()
    const typeRef = idMember!.type as { kind?: string }
    expect(typeRef.kind).toBe('intrinsic')
  })

  it('mapped type (OptionalKeys) is emitted structurally', async () => {
    const mod = await loadBundle('unknown_complex')
    const symbols = getSymbols(mod)
    const optionalKeys = findSymbol(symbols, 'OptionalKeys')
    expect(optionalKeys.definition).toBeDefined()
    const def = optionalKeys.definition as {
      kind?: string
      typeParam?: string
      sourceType?: { kind?: string; operator?: string; target?: { name?: string } }
      optionalModifier?: string
      readonlyModifier?: string
      valueType?: { kind?: string; object?: { name?: string }; index?: { name?: string } }
    }
    expect(def.kind).toBe('mapped')
    expect(def.typeParam).toBe('P')
    expect(def.sourceType?.kind).toBe('type_operator')
    expect(def.sourceType?.operator).toBe('keyof')
    expect(def.sourceType?.target?.name).toBe('T')
    expect(def.optionalModifier).toBe('add')
    expect(def.readonlyModifier).toBe('preserve')
    expect(def.valueType?.kind).toBe('indexed_access')
    expect(def.valueType?.object?.name).toBe('T')
    expect(def.valueType?.index?.name).toBe('P')
  })

  it('member type that uses mapped type (partialUser) is reference with typeArguments', async () => {
    const mod = await loadBundle('unknown_complex')
    const symbols = getSymbols(mod)
    const usesOptionalKeys = findSymbol(symbols, 'UsesOptionalKeys')
    const partialUserMember = usesOptionalKeys.members!.find((m) => m.name === 'partialUser')
    expect(partialUserMember).toBeDefined()
    expect(partialUserMember!.type).toBeDefined()
    // OptionalKeys<User> is emitted as a reference to OptionalKeys with typeArguments [User]
    // (the definition of OptionalKeys is mapped; the usage is still a typed ref)
    const typeRef = partialUserMember!.type as {
      id?: string
      name?: string
      library?: string
      typeArguments?: unknown[]
    }
    expect(typeRef.name).toBe('OptionalKeys')
    expect(typeRef.library).toBe('user')
    expect(typeRef.typeArguments).toBeDefined()
    expect(Array.isArray(typeRef.typeArguments)).toBe(true)
    expect(typeRef.typeArguments!.length).toBe(1)
    const userArg = typeRef.typeArguments![0] as { name?: string }
    expect(userArg.name).toBe('User')
  })

  it('conditional type (StringKeys) is emitted structurally', async () => {
    const mod = await loadBundle('unknown_complex')
    const symbols = getSymbols(mod)
    const stringKeys = findSymbol(symbols, 'StringKeys')
    expect(stringKeys.definition).toBeDefined()
    const def = stringKeys.definition as {
      kind?: string
      checkType?: { name?: string }
      extendsType?: { kind?: string; name?: string }
      trueType?: {
        kind?: string
        typeParam?: string
        nameType?: { kind?: string }
        valueType?: { kind?: string }
      }
      falseType?: { kind?: string; name?: string }
    }
    expect(def.kind).toBe('conditional')
    expect(def.checkType?.name).toBe('T')
    expect(def.extendsType?.kind).toBe('intrinsic')
    expect(def.extendsType?.name).toBe('object')
    expect(def.trueType?.kind).toBe('mapped')
    expect(def.trueType?.typeParam).toBe('K')
    expect(def.trueType?.nameType?.kind).toBe('conditional')
    expect(def.trueType?.valueType?.kind).toBe('indexed_access')
    expect(def.falseType?.kind).toBe('intrinsic')
    expect(def.falseType?.name).toBe('never')
  })
})
