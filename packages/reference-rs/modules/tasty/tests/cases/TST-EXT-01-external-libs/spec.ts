/**
 * Station specification for TST-EXT-01-external-libs.
 * Verifies external library references, extends inheritance chains, and member flattening.
 * Proves primary SPEC ID anchor TST-EXT-01.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import { findMember, type TastyCaseResult } from '../../helpers.js'

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-EXT-01',
  async verify({ api }) {
    const buttonProps = await api.loadSymbolByName('ButtonProps')

    const extendsSymbols = await buttonProps.loadExtendsSymbols()
    const flattened = await api.graph.flattenInterfaceMembers(buttonProps)
    const refs = await api.graph.collectUserOwnedReferences(buttonProps)
    const dependencies = await api.graph.loadImmediateDependencies(buttonProps)

    expect(extendsSymbols.map(symbol => symbol.getName())).toEqual(['StyleProps'])
    expect(flattened.map(member => member.getName())).toContain('tone')
    expect(flattened.map(member => member.getName())).toContain('size')
    expect(refs.map(ref => ref.getName()).sort()).toEqual(['Size', 'StyleProps'])
    expect(dependencies.map(symbol => symbol.getName()).sort()).toEqual([
      'Size',
      'StyleProps',
    ])

    const buttonSchema = await api.loadSymbolByName('ButtonSchema')
    const cssType = findMember(buttonProps, 'css').getType()?.getRaw() as {
      name?: string
      library?: string
    }
    const schemaType = findMember(buttonProps, 'schema').getType()?.getRaw() as {
      name?: string
      library?: string
    }
    expect(cssType.name).toBe('Properties')
    expect(cssType.library).toBe('csstype')
    expect(schemaType.name).toBe('JSONSchema4')
    expect(schemaType.library).toBe('json-schema')

    const buttonPropsRaw = buttonProps.getRaw() as {
      description?: string
      members: Array<{ name: string; description?: string }>
    }
    expect(buttonPropsRaw.description).toContain('Props for the Button component')
    expect(
      buttonPropsRaw.members.find(member => member.name === 'size')?.description
    ).toBe('Preferred size variant.')

    const buttonSchemaRaw = buttonSchema.getRaw() as { description?: string }
    expect(buttonSchemaRaw.description).toBe(
      'JSON Schema extension for button component configuration.'
    )
  },
}

export default spec
