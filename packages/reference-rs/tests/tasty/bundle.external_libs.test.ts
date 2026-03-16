/**
 * Vitest tests for the external_libs scenario bundle.
 * Tests scanning with external packages (node_modules: csstype, json-schema, etc.).
 * Bundles are emitted by globalSetup using the compiled napi-rs runtime (scanAndEmitBundle).
 * Output: output/external_libs/bundle.js
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

/** All exported symbol-like objects from the bundle (each has id, name, library). */
function getSymbols(mod: Record<string, unknown>) {
  return Object.values(mod).filter(
    (v): v is Record<string, unknown> =>
      v !== null &&
      typeof v === 'object' &&
      'name' in v &&
      'library' in v &&
      'id' in v
  ) as Array<{ id: string; name: string; library: string; extends?: unknown[]; members?: unknown[]; description?: string }>
}

function findSymbol(symbols: ReturnType<typeof getSymbols>, name: string) {
  const s = symbols.find((s) => s.name === name)
  if (!s) throw new Error(`Symbol not found: ${name}`)
  return s
}

function findMember(members: Array<{ name: string; description?: string; type?: unknown }>, name: string) {
  const m = members?.find((m) => m.name === name)
  if (!m) throw new Error(`Member not found: ${name}`)
  return m
}

describe('external_libs bundle', () => {
  it('exports interfaces and types arrays', async () => {
    const mod = await loadBundle('external_libs')
    expect(mod.interfaces).toBeDefined()
    expect(Array.isArray(mod.interfaces)).toBe(true)
    expect(mod.types).toBeDefined()
    expect(Array.isArray(mod.types)).toBe(true)
    expect(mod.libraries).toBeDefined()
  })

  it('has expected exported symbols from button and index', async () => {
    const mod = await loadBundle('external_libs')
    const symbols = getSymbols(mod)
    const names = symbols.map((s) => s.name)
    expect(names).toContain('ButtonSchema')
    expect(names).toContain('ButtonProps')
    expect(names).toContain('Size')
    expect(names).toContain('DocsEntry')
    expect(names).toContain('StyleProps')
  })

  it('ButtonProps extends StyleProps and has expected members', async () => {
    const mod = await loadBundle('external_libs')
    const symbols = getSymbols(mod)
    const buttonProps = findSymbol(symbols, 'ButtonProps')
    expect(buttonProps.library).toBe('user')
    expect(buttonProps.extends).toBeDefined()
    expect(Array.isArray(buttonProps.extends)).toBe(true)
    const extendsRef = (buttonProps.extends as Array<{ name: string; id?: string }>)[0]
    expect(extendsRef?.name).toBe('StyleProps')
    expect(extendsRef?.id).toBeDefined()

    const sizeMember = findMember(buttonProps.members ?? [], 'size')
    expect(sizeMember.type).toBeDefined()
    const typeRef = sizeMember.type as { name?: string; id?: string }
    expect(typeRef?.name).toBe('Size')
    expect(typeRef?.id).toBeDefined()
  })

  it('preserves external library references (css, schema)', async () => {
    const mod = await loadBundle('external_libs')
    const symbols = getSymbols(mod)
    const buttonProps = findSymbol(symbols, 'ButtonProps')
    const cssMember = findMember(buttonProps.members ?? [], 'css')
    const schemaMember = findMember(buttonProps.members ?? [], 'schema')
    // Member type for references is { id, name, library } (no source_module in emitted ref)
    const cssRef = cssMember.type as { name?: string; library?: string }
    const schemaRef = schemaMember.type as { name?: string; library?: string }
    // Resolved refs use the actual symbol name (Properties in csstype, not the local alias CSSProperties)
    expect(cssRef?.name).toBe('Properties')
    expect(cssRef?.library).toBe('csstype')
    expect(schemaRef?.name).toBe('JSONSchema4')
    expect(schemaRef?.library).toBe('json-schema')
  })

  it('tracks library metadata on symbols', async () => {
    const mod = await loadBundle('external_libs')
    const symbols = getSymbols(mod)
    const buttonSchema = findSymbol(symbols, 'ButtonSchema')
    const cssProperties = symbols.find((s) => s.name === 'Properties' && s.library === 'csstype')
    const jsonSchema = findSymbol(symbols, 'JSONSchema4')
    expect(buttonSchema.library).toBe('user')
    expect(cssProperties?.library).toBe('csstype')
    expect(jsonSchema.library).toBe('json-schema')
  })

  it('captures leading comments for types and members', async () => {
    const mod = await loadBundle('external_libs')
    const symbols = getSymbols(mod)
    const size = findSymbol(symbols, 'Size')
    expect(size.description).toBe('Supported button size variants.')

    const buttonSchema = findSymbol(symbols, 'ButtonSchema')
    expect(buttonSchema.description).toBe('JSON Schema extension for button component configuration.')

    const buttonProps = findSymbol(symbols, 'ButtonProps')
    expect(buttonProps.description).toContain('Props for the Button component')
    expect(buttonProps.description).toContain('Extends style props')

    const sizeMember = findMember(buttonProps.members ?? [], 'size')
    expect(sizeMember.description).toBe('Preferred size variant.')
    const cssMember = findMember(buttonProps.members ?? [], 'css')
    expect(cssMember.description).toBe('Optional inline CSS properties.')
    const disabledMember = findMember(buttonProps.members ?? [], 'disabled')
    expect(disabledMember.description).toBeUndefined()

    const docsEntry = findSymbol(symbols, 'DocsEntry')
    expect(docsEntry.description).toBe('A documentation entry that references component props.')
    const propsMember = findMember(docsEntry.members ?? [], 'props')
    expect(propsMember.description).toBe('The component props for this entry.')
  })

  it('does not attach local comment snippets to external symbols', async () => {
    const mod = await loadBundle('external_libs')
    const symbols = getSymbols(mod)
    const cssProperties = symbols.find((s) => s.name === 'Properties' && s.library === 'csstype')
    expect(cssProperties).toBeDefined()
    const localSnippets = [
      'Supported button size',
      'ButtonSchema',
      'ButtonProps',
      'Preferred size variant',
      'documentation entry',
      'component props for this entry',
    ]
    const desc = cssProperties?.description ?? ''
    for (const snippet of localSnippets) {
      expect(desc).not.toContain(snippet)
    }
  })
})
