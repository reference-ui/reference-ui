/**
 * Vitest tests for the default_params scenario bundle.
 * Asserts that type parameters with default (e.g. T = string) are emitted.
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
    typeParameters?: Array<{ name: string; constraint?: unknown; default?: unknown }>
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

describe('default_params bundle', () => {
  it('exports interfaces and types arrays', async () => {
    const mod = await loadBundle('default_params')
    expect(mod.interfaces).toBeDefined()
    expect(mod.types).toBeDefined()
  })

  it('has expected symbols', async () => {
    const mod = await loadBundle('default_params')
    const symbols = getSymbols(mod)
    const names = symbols.map((s) => s.name)
    expect(names).toContain('WithDefault')
    expect(names).toContain('KeyValue')
    expect(names).toContain('PartialDefault')
  })

  it('emits default on type parameter (WithDefault<T = string>)', async () => {
    const mod = await loadBundle('default_params')
    const symbols = getSymbols(mod)
    const withDefault = findSymbol(symbols, 'WithDefault')
    expect(withDefault.typeParameters).toBeDefined()
    expect(withDefault.typeParameters!).toHaveLength(1)
    const t = withDefault.typeParameters![0]
    expect(t.name).toBe('T')
    expect(t.default).toBeDefined()
    const defaultRef = t.default as { kind?: string; name?: string }
    expect(defaultRef?.kind).toBe('intrinsic')
    expect(defaultRef?.name).toBe('string')
  })

  it('emits defaults on multiple params (KeyValue<K = string, V = unknown>)', async () => {
    const mod = await loadBundle('default_params')
    const symbols = getSymbols(mod)
    const keyValue = findSymbol(symbols, 'KeyValue')
    expect(keyValue.typeParameters).toBeDefined()
    expect(keyValue.typeParameters!).toHaveLength(2)
    const k = keyValue.typeParameters!.find((p) => p.name === 'K')
    const v = keyValue.typeParameters!.find((p) => p.name === 'V')
    expect(k?.default).toBeDefined()
    expect(v?.default).toBeDefined()
    const kDefault = k!.default as { kind?: string; name?: string }
    const vDefault = v!.default as { kind?: string; name?: string }
    expect(kDefault?.kind).toBe('intrinsic')
    expect(kDefault?.name).toBe('string')
    expect(vDefault?.kind).toBe('intrinsic')
    expect(vDefault?.name).toBe('unknown')
  })

  it('emits only second param with default (PartialDefault<T, U = number>)', async () => {
    const mod = await loadBundle('default_params')
    const symbols = getSymbols(mod)
    const partialDefault = findSymbol(symbols, 'PartialDefault')
    expect(partialDefault.typeParameters).toBeDefined()
    expect(partialDefault.typeParameters!).toHaveLength(2)
    const t = partialDefault.typeParameters!.find((p) => p.name === 'T')
    const u = partialDefault.typeParameters!.find((p) => p.name === 'U')
    expect(t?.default).toBeUndefined()
    expect(u?.default).toBeDefined()
    const uDefault = u!.default as { kind?: string; name?: string }
    expect(uDefault?.name).toBe('number')
  })
})
