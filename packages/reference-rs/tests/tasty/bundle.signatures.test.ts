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
      optional?: boolean
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
    expect(names).toContain('NamedPair')
    expect(names).toContain('WithOptionalElement')
    expect(names).toContain('WithRest')
    expect(names).toContain('Constructible')
    expect(names).toContain('ParenType')
    expect(names).toContain('MouseEvent')
    expect(names).toContain('WithCallback')
    expect(names).toContain('MouseEventCtor')
    expect(names).toContain('AbstractMouseEventCtor')
  })

  it('emits readonly, optional, and kind on members (ReadonlyProps)', async () => {
    const mod = await loadBundle('signatures')
    const symbols = getSymbols(mod)
    const readonlyProps = findSymbol(symbols, 'ReadonlyProps')
    expect(readonlyProps.members).toBeDefined()
    const idMember = readonlyProps.members!.find((m) => m.name === 'id')
    const labelMember = readonlyProps.members!.find((m) => m.name === 'label')
    expect(idMember).toBeDefined()
    expect(idMember!.readonly).toBe(true)
    expect(idMember!.optional).toBe(false)
    expect(idMember!.kind).toBe('property')
    expect(labelMember).toBeDefined()
    expect(labelMember!.readonly).toBe(false)
    expect(labelMember!.optional).toBe(true)
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

  it('emits tuple type with element shape (StringNumberPair)', async () => {
    const mod = await loadBundle('signatures')
    const symbols = getSymbols(mod)
    const pair = findSymbol(symbols, 'StringNumberPair')
    const def = pair.definition as {
      kind?: string
      elements?: Array<{ optional?: boolean; rest?: boolean; label?: string; element?: unknown }>
    }
    expect(def.kind).toBe('tuple')
    expect(Array.isArray(def.elements)).toBe(true)
    expect(def.elements!.length).toBe(2)
    def.elements!.forEach((el) => {
      expect(el.optional).toBe(false)
      expect(el.rest).toBe(false)
      expect(el.element).toBeDefined()
    })
  })

  it('emits named tuple with labels (NamedPair)', async () => {
    const mod = await loadBundle('signatures')
    const symbols = getSymbols(mod)
    const namedPair = findSymbol(symbols, 'NamedPair')
    const def = namedPair.definition as {
      kind?: string
      elements?: Array<{ optional?: boolean; rest?: boolean; label?: string; element?: unknown }>
    }
    expect(def.kind).toBe('tuple')
    expect(def.elements!.length).toBe(2)
    expect(def.elements![0].label).toBe('name')
    expect(def.elements![1].label).toBe('age')
    expect(def.elements![0].optional).toBe(false)
    expect(def.elements![1].optional).toBe(false)
  })

  it('emits tuple with optional element (WithOptionalElement)', async () => {
    const mod = await loadBundle('signatures')
    const symbols = getSymbols(mod)
    const withOpt = findSymbol(symbols, 'WithOptionalElement')
    const def = withOpt.definition as {
      kind?: string
      elements?: Array<{ optional?: boolean; rest?: boolean; element?: unknown }>
    }
    expect(def.kind).toBe('tuple')
    expect(def.elements!.length).toBe(2)
    expect(def.elements![0].optional).toBe(false)
    expect(def.elements![1].optional).toBe(true)
  })

  it('emits tuple with rest element (WithRest)', async () => {
    const mod = await loadBundle('signatures')
    const symbols = getSymbols(mod)
    const withRest = findSymbol(symbols, 'WithRest')
    const def = withRest.definition as {
      kind?: string
      elements?: Array<{ optional?: boolean; rest?: boolean; element?: unknown }>
    }
    expect(def.kind).toBe('tuple')
    expect(def.elements!.length).toBe(2)
    expect(def.elements![0].rest).toBe(false)
    expect(def.elements![1].rest).toBe(true)
  })

  it('emits construct signature as [new] with kind "construct" (Constructible)', async () => {
    const mod = await loadBundle('signatures')
    const symbols = getSymbols(mod)
    const constructible = findSymbol(symbols, 'Constructible')
    const newMember = constructible.members!.find((m) => m.name === '[new]')
    expect(newMember).toBeDefined()
    expect(newMember!.kind).toBe('construct')
    expect(newMember!.type).toBeDefined()
  })

  it('unwraps parenthesized type (ParenType)', async () => {
    const mod = await loadBundle('signatures')
    const symbols = getSymbols(mod)
    const parenType = findSymbol(symbols, 'ParenType')
    const def = parenType.definition as { kind?: string; name?: string }
    expect(def.kind).toBe('intrinsic')
    expect(def.name).toBe('string')
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

  it('emits callback (function) type with params and returnType (WithCallback)', async () => {
    const mod = await loadBundle('signatures')
    const symbols = getSymbols(mod)
    const withCallback = findSymbol(symbols, 'WithCallback')
    expect(withCallback.members).toBeDefined()
    const onClickMember = withCallback.members!.find((m) => m.name === 'onClick')
    expect(onClickMember).toBeDefined()
    const type = onClickMember!.type as {
      kind?: string
      params?: Array<{ name?: string; optional?: boolean; typeRef?: unknown }>
      returnType?: unknown
    }
    expect(type.kind).toBe('function')
    expect(Array.isArray(type.params)).toBe(true)
    expect(type.params!.length).toBe(1)
    expect(type.params![0].name).toBe('event')
    expect(type.params![0].optional).toBe(false)
    expect(type.params![0].typeRef).toBeDefined()
    expect(type.returnType).toBeDefined()
    const returnType = type.returnType as { kind?: string; name?: string }
    expect(returnType.kind).toBe('intrinsic')
    expect(returnType.name).toBe('void')
  })

  it('emits constructor type with params and returnType (MouseEventCtor)', async () => {
    const mod = await loadBundle('signatures')
    const symbols = getSymbols(mod)
    const mouseEventCtor = findSymbol(symbols, 'MouseEventCtor')
    const def = mouseEventCtor.definition as {
      kind?: string
      abstract?: boolean
      params?: Array<{ name?: string; optional?: boolean; typeRef?: unknown }>
      returnType?: { name?: string; library?: string }
    }
    expect(def.kind).toBe('constructor')
    expect(def.abstract).toBe(false)
    expect(Array.isArray(def.params)).toBe(true)
    expect(def.params?.length).toBe(1)
    expect(def.params?.[0]?.name).toBe('event')
    expect(def.returnType?.name).toBe('MouseEvent')
    expect(def.returnType?.library).toBe('user')
  })

  it('emits abstract constructor type with type parameters (AbstractMouseEventCtor)', async () => {
    const mod = await loadBundle('signatures')
    const symbols = getSymbols(mod)
    const abstractCtor = findSymbol(symbols, 'AbstractMouseEventCtor')
    const def = abstractCtor.definition as {
      kind?: string
      abstract?: boolean
      typeParameters?: Array<{ name?: string; default?: { kind?: string; name?: string } }>
      params?: Array<{ name?: string; typeRef?: { name?: string } }>
      returnType?: { name?: string }
    }
    expect(def.kind).toBe('constructor')
    expect(def.abstract).toBe(true)
    expect(def.typeParameters?.length).toBe(1)
    expect(def.typeParameters?.[0]?.name).toBe('T')
    expect(def.typeParameters?.[0]?.default?.kind).toBe('intrinsic')
    expect(def.typeParameters?.[0]?.default?.name).toBe('string')
    expect(def.params?.[0]?.name).toBe('value')
    expect(def.params?.[0]?.typeRef?.name).toBe('T')
    expect(def.returnType?.name).toBe('MouseEvent')
  })
})
