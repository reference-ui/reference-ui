import { describe, expect, it } from 'vitest'

import { addCaseRuntimeSmokeTests, createCaseApi, findMember } from '../../api-test-helpers'

describe('external_libs tasty api', () => {
  addCaseRuntimeSmokeTests('external_libs', 'ButtonProps')

  it('loads extends chains and user-owned dependencies', async () => {
    const api = createCaseApi('external_libs')
    const buttonProps = await api.loadSymbolByName('ButtonProps')

    const extendsSymbols = await buttonProps.loadExtendsSymbols()
    const flattened = await api.graph.flattenInterfaceMembers(buttonProps)
    const refs = await api.graph.collectUserOwnedReferences(buttonProps)
    const dependencies = await api.graph.loadImmediateDependencies(buttonProps)

    expect(extendsSymbols.map((symbol) => symbol.getName())).toEqual(['StyleProps'])
    expect(flattened.map((member) => member.getName())).toContain('tone')
    expect(flattened.map((member) => member.getName())).toContain('size')
    expect(refs.map((ref) => ref.getName()).sort()).toEqual(['Size', 'StyleProps'])
    expect(dependencies.map((symbol) => symbol.getName()).sort()).toEqual(['Size', 'StyleProps'])
  })

  it('preserves external references and descriptions on raw contracts', async () => {
    const api = createCaseApi('external_libs')
    const buttonProps = await api.loadSymbolByName('ButtonProps')
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
    expect(buttonPropsRaw.members.find((member) => member.name === 'size')?.description).toBe(
      'Preferred size variant.'
    )

    const buttonSchemaRaw = buttonSchema.getRaw() as { description?: string }
    expect(buttonSchemaRaw.description).toBe('JSON Schema extension for button component configuration.')
  })
})
