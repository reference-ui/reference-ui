/**
 * Vitest tests for audit-alignment coverage.
 * Focuses on variants called out in OXC_TYPE_AUDIT.md that should stay
 * structural or intentionally raw.
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

describe('audit_alignment bundle', () => {
  it('has expected symbols for raw and structural audit coverage', async () => {
    const mod = await loadBundle()
    const symbols = getSymbols(mod)
    const names = symbols.map((s) => s.name)

    expect(names).toContain('RemoteWidget')
    expect(names).toContain('Flatten')
    expect(names).toContain('WithImportMember')
    expect(names).toContain('WithPredicate')
    expect(names).toContain('WithThisType')
  })

  it('preserves import types as raw summaries', async () => {
    const mod = await loadBundle()
    const symbols = getSymbols(mod)
    const remoteWidget = findSymbol(symbols, 'RemoteWidget')
    const def = remoteWidget.definition as { kind?: string; summary?: string }

    expect(def.kind).toBe('raw')
    expect(def.summary).toBe("import('./dep').Widget")
  })

  it('keeps conditional types structural when infer remains raw inside nested positions', async () => {
    const mod = await loadBundle()
    const symbols = getSymbols(mod)
    const flatten = findSymbol(symbols, 'Flatten')
    const def = flatten.definition as {
      kind?: string
      checkType?: { name?: string }
      extendsType?: { kind?: string; element?: { kind?: string; summary?: string } }
      trueType?: { name?: string }
      falseType?: { name?: string }
    }

    expect(def.kind).toBe('conditional')
    expect(def.checkType?.name).toBe('T')
    expect(def.extendsType?.kind).toBe('array')
    expect(def.extendsType?.element?.kind).toBe('raw')
    expect(def.extendsType?.element?.summary).toBe('infer U')
    expect(def.trueType?.name).toBe('U')
    expect(def.falseType?.name).toBe('T')
  })

  it('preserves import types on members as raw summaries', async () => {
    const mod = await loadBundle()
    const symbols = getSymbols(mod)
    const withImportMember = findSymbol(symbols, 'WithImportMember')
    const widgetMember = withImportMember.members?.find((m) => m.name === 'widget')

    expect(widgetMember).toBeDefined()
    expect((widgetMember!.type as { kind?: string }).kind).toBe('raw')
    expect((widgetMember!.type as { summary?: string }).summary).toBe("import('./dep').Widget")
  })

  it('emits function types structurally while preserving predicate returns as raw', async () => {
    const mod = await loadBundle()
    const symbols = getSymbols(mod)
    const withPredicate = findSymbol(symbols, 'WithPredicate')
    const isUserMember = withPredicate.members?.find((m) => m.name === 'isUser')
    const type = isUserMember?.type as {
      kind?: string
      params?: Array<{ name?: string; optional?: boolean; typeRef?: { kind?: string; name?: string } }>
      returnType?: { kind?: string; summary?: string }
    }

    expect(isUserMember).toBeDefined()
    expect(type.kind).toBe('function')
    expect(type.params?.length).toBe(1)
    expect(type.params?.[0]?.name).toBe('value')
    expect(type.params?.[0]?.optional).toBe(false)
    expect(type.params?.[0]?.typeRef?.kind).toBe('intrinsic')
    expect(type.params?.[0]?.typeRef?.name).toBe('unknown')
    expect(type.returnType?.kind).toBe('raw')
    expect(type.returnType?.summary).toBe('value is User')
  })

  it('preserves this types as raw summaries on members', async () => {
    const mod = await loadBundle()
    const symbols = getSymbols(mod)
    const withThisType = findSymbol(symbols, 'WithThisType')
    const selfMember = withThisType.members?.find((m) => m.name === 'self')

    expect(selfMember).toBeDefined()
    expect((selfMember!.type as { kind?: string }).kind).toBe('raw')
    expect((selfMember!.type as { summary?: string }).summary).toBe('this')
  })
})
