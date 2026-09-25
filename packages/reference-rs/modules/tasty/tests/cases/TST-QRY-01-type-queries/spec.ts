/**
 * Station specification for TST-QRY-01-type-queries.
 * Verifies typeof query expressions across aliases and member wrappers.
 * Proves primary SPEC ID anchor TST-QRY-01.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import { findMember, type TastyApi, type TastyCaseResult } from '../../helpers.js'

interface TypeQueryRaw {
  kind?: string
  expression?: string
  resolved?: {
    kind?: string
    members?: Array<{ name?: string }>
  }
}

function expectSpacingObject(raw: TypeQueryRaw | undefined, expression: string): void {
  expect(raw?.kind).toBe('type_query')
  expect(raw?.expression).toBe(expression)
  expect(raw?.resolved?.kind).toBe('object')
  expect(raw?.resolved?.members?.map(member => member.name).sort()).toEqual(['lg', 'sm'])
}

async function verifyImportedTypeQueries(api: TastyApi): Promise<void> {
  const imported = await api.loadSymbolByName('ImportedSpacingScale')
  expectSpacingObject(
    imported.getUnderlyingType()?.getRaw() as TypeQueryRaw,
    'tokens.spacing'
  )

  const aliased = await api.loadSymbolByName('AliasedSpacingScale')
  expectSpacingObject(
    aliased.getUnderlyingType()?.getRaw() as TypeQueryRaw,
    'aliasedTokens.spacing'
  )

  const withImported = await api.loadSymbolByName('WithImportedTypeQueries')
  expectSpacingObject(
    findMember(withImported, 'spacing').getType()?.getRaw() as TypeQueryRaw,
    'tokens.spacing'
  )
  expectSpacingObject(
    findMember(withImported, 'aliased').getType()?.getRaw() as TypeQueryRaw,
    'aliasedTokens.spacing'
  )
}

async function verifyTypeofCycleFailsClosed(api: TastyApi): Promise<void> {
  const cycle = await api.loadSymbolByName('CycleType')
  const raw = cycle.getUnderlyingType()?.getRaw() as TypeQueryRaw
  expect(raw.kind).toBe('type_query')
  expect(raw.expression).toBe('cycleA')
  expect(raw.resolved ?? undefined).toBeUndefined()
}

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-QRY-01',
  async verify({ api }) {
    const themeConfig = await api.loadSymbolByName('ThemeConfig')
    const spacingScale = await api.loadSymbolByName('SpacingScale')
    const withTypeQueries = await api.loadSymbolByName('WithTypeQueries')

    expect(themeConfig.getUnderlyingType()?.getKind()).toBe('type_query')
    expect(
      (themeConfig.getUnderlyingType()?.getRaw() as { expression?: string }).expression
    ).toBe('themeConfig')
    expect(
      (spacingScale.getUnderlyingType()?.getRaw() as { expression?: string }).expression
    ).toBe('tokens.spacing')

    const configType = findMember(withTypeQueries, 'config').getType()?.getRaw() as {
      kind?: string
      expression?: string
    }
    const spacingType = findMember(withTypeQueries, 'spacing').getType()?.getRaw() as {
      kind?: string
      expression?: string
    }
    expect(configType.kind).toBe('type_query')
    expect(configType.expression).toBe('themeConfig')
    expect(spacingType.kind).toBe('type_query')
    expect(spacingType.expression).toBe('tokens.spacing')

    await verifyImportedTypeQueries(api)
    await verifyTypeofCycleFailsClosed(api)
  },
}

export default spec
