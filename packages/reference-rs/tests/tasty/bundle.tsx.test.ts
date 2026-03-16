/**
 * Vitest tests for the tsx scenario bundle.
 * Asserts that .tsx files are scanned and interfaces/types are extracted.
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
    members?: Array<{ name: string; optional?: boolean }>
    definition?: { kind?: string }
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

describe('tsx bundle', () => {
  it('exports interfaces and types arrays', async () => {
    const mod = await loadBundle('tsx')
    expect(mod.interfaces).toBeDefined()
    expect(Array.isArray(mod.interfaces)).toBe(true)
    expect(mod.types).toBeDefined()
    expect(Array.isArray(mod.types)).toBe(true)
  })

  it('has symbols from .tsx file (ButtonProps, ButtonVariant)', async () => {
    const mod = await loadBundle('tsx')
    const symbols = getSymbols(mod)
    const names = symbols.map((s) => s.name)
    expect(names).toContain('ButtonProps')
    expect(names).toContain('ButtonVariant')
  })

  it('ButtonProps has expected members and optional flags', async () => {
    const mod = await loadBundle('tsx')
    const symbols = getSymbols(mod)
    const buttonProps = findSymbol(symbols, 'ButtonProps')
    expect(buttonProps.members).toBeDefined()
    const label = buttonProps.members!.find((m) => m.name === 'label')
    const onClick = buttonProps.members!.find((m) => m.name === 'onClick')
    const disabled = buttonProps.members!.find((m) => m.name === 'disabled')
    expect(label).toBeDefined()
    expect(label!.optional).toBe(false)
    expect(onClick).toBeDefined()
    expect(onClick!.optional).toBe(true)
    expect(disabled).toBeDefined()
    expect(disabled!.optional).toBe(true)
  })

  it('ButtonVariant is type alias with definition', async () => {
    const mod = await loadBundle('tsx')
    const symbols = getSymbols(mod)
    const buttonVariant = findSymbol(symbols, 'ButtonVariant')
    expect(buttonVariant.definition).toBeDefined()
    const def = buttonVariant.definition as { kind?: string }
    expect(def.kind).toBe('union')
  })

  it('emits libraries array including user', async () => {
    const mod = await loadBundle('tsx')
    expect(mod.libraries).toBeDefined()
    expect(mod.libraries).toContain('user')
  })
})
