/**
 * Vitest tests for the jsdoc scenario bundle.
 * Asserts summary fallback, raw comment passthrough, and parsed JSDoc tags.
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
    description?: string
    descriptionRaw?: string
    jsdoc?: { summary?: string; tags?: Array<{ name?: string; value?: string }> }
    members?: Array<{
      name: string
      description?: string
      descriptionRaw?: string
      jsdoc?: { summary?: string; tags?: Array<{ name?: string; value?: string }> }
      type?: unknown
    }>
  }>
}

function findSymbol(symbols: ReturnType<typeof getSymbols>, name: string) {
  const symbol = symbols.find((s) => s.name === name)
  if (!symbol) throw new Error(`Symbol not found: ${name}`)
  return symbol
}

describe('jsdoc bundle', () => {
  it('has expected symbols', async () => {
    const mod = await loadBundle()
    const symbols = getSymbols(mod)
    const names = symbols.map((s) => s.name)
    expect(names).toContain('ButtonProps')
    expect(names).toContain('CreateButton')
  })

  it('derives description from JSDoc summary and preserves raw text', async () => {
    const mod = await loadBundle()
    const symbols = getSymbols(mod)
    const buttonProps = findSymbol(symbols, 'ButtonProps')
    expect(buttonProps.description).toBe('Props for a button.\n\nIncludes common sizing options.')
    expect(buttonProps.descriptionRaw).toContain('@deprecated Use NewButtonProps instead.')
    expect(buttonProps.descriptionRaw).toContain('@remarks This interface is kept for backward compatibility.')
    expect(buttonProps.jsdoc?.summary).toBe('Props for a button.\n\nIncludes common sizing options.')
  })

  it('parses JSDoc tags on symbols and members', async () => {
    const mod = await loadBundle()
    const symbols = getSymbols(mod)
    const buttonProps = findSymbol(symbols, 'ButtonProps')
    expect(buttonProps.jsdoc?.tags?.map((t) => t.name)).toEqual(['deprecated', 'remarks'])
    expect(buttonProps.jsdoc?.tags?.[0]?.value).toBe('Use NewButtonProps instead.')
    expect(buttonProps.jsdoc?.tags?.[1]?.value).toBe('This interface is kept for backward compatibility.')

    const sizeMember = buttonProps.members?.find((m) => m.name === 'size')
    expect(sizeMember).toBeDefined()
    expect(sizeMember?.description).toBe('Preferred size variant.')
    expect(sizeMember?.descriptionRaw).toContain('@default "sm"')
    expect(sizeMember?.jsdoc?.tags?.map((t) => t.name)).toEqual(['default', 'example'])
    expect(sizeMember?.jsdoc?.tags?.[0]?.value).toBe('"sm"')
    expect(sizeMember?.jsdoc?.tags?.[1]?.value).toBe('<Button size="sm" />')
  })

  it('falls back cleanly for non-JSDoc comments', async () => {
    const mod = await loadBundle()
    const symbols = getSymbols(mod)
    const buttonProps = findSymbol(symbols, 'ButtonProps')
    const disabledMember = buttonProps.members?.find((m) => m.name === 'disabled')
    expect(disabledMember).toBeDefined()
    expect(disabledMember?.description).toBe('Plain comment fallback.')
    expect(disabledMember?.descriptionRaw).toBe('Plain comment fallback.')
    expect(disabledMember?.jsdoc).toBeUndefined()
  })
})
