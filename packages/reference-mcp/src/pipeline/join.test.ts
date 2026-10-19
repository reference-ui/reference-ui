// Vitest tests for the Atlas/reference join.
// They take observed components plus reference documents and assert joined props,
// style-prop filtering, and the reference-data conversion.
import { describe, expect, it } from 'vitest'
import type { Component } from '@reference-ui/rust/atlas'
import type { ReferenceDocument } from '@reference-ui/core/reference'
import { joinMcpComponent, toMcpReferenceData } from './join'

function createComponent(): Component {
  return {
    name: 'Button',
    source: './src/components/Button.tsx',
    count: 6,
    usage: 'very common',
    examples: ['<Button variant="solid" />'],
    usedWith: { Stack: 'common' },
    interface: {
      name: 'ButtonProps',
      source: './src/components/Button.tsx',
    },
    props: [
      {
        name: 'variant',
        count: 6,
        usage: 'very common',
        values: { solid: 'common', ghost: 'rare' },
      },
      {
        name: 'loading',
        count: 1,
        usage: 'rare',
      },
    ],
  }
}

function createDocument(): ReferenceDocument {
  return {
    id: 'button-props',
    name: 'ButtonProps',
    kind: 'interface',
    kindLabel: 'Interface',
    warnings: [
      {
        severity: 'warning',
        code: 'TST-W-DUPLICATE-MEMBER',
        message: 'duplicate member variant',
        file: './src/components/Button.tsx',
        line: 4,
        column: 3,
      },
    ],
    description: 'Button props',
    jsDoc: { summary: 'Button props', tags: [] },
    typeParameters: [],
    typeParameterDetails: [],
    extendsNames: [],
    extends: [],
    types: [],
    definition: null,
    definitionType: null,
    members: [
      {
        id: 'variant',
        name: 'variant',
        kind: 'property',
        optional: false,
        readonly: false,
        declaredBy: { id: 'button-props', name: 'ButtonProps' },
        semanticKind: 'property' as never,
        defaultValue: 'solid',
        typeLabel: '"solid" | "ghost"',
        type: undefined,
        jsDoc: {
          summary: 'Visual variant',
          description: 'Controls visual treatment',
          tags: [],
        },
        summary: {
          description: 'Controls visual treatment',
          paramDocs: [],
        },
      },
    ],
  }
}

describe('joinMcpComponent', () => {
  it('enriches Atlas props with generated type metadata', () => {
    const result = joinMcpComponent(createComponent(), createDocument())

    expect(result.interface).toEqual({
      name: 'ButtonProps',
      source: './src/components/Button.tsx',
    })
    expect(result.description).toBe('Button props')
    expect(result.props[0]).toMatchObject({
      name: 'variant',
      type: '"solid" | "ghost"',
      description: 'Controls visual treatment',
      defaultValue: 'solid',
      optional: false,
      readonly: false,
      origin: 'observed',
      styleProp: false,
    })
    expect(result.props[1]).toMatchObject({
      name: 'loading',
      type: null,
      description: null,
      origin: 'observed',
    })
  })

  it('keeps Atlas data when no reference document is available', () => {
    const result = joinMcpComponent(createComponent(), null)

    expect(result.description).toBeNull()
    expect(result.props[0]).toMatchObject({
      name: 'variant',
      usage: 'very common',
      type: null,
      description: null,
    })
  })

  it('adds documented members when Atlas does not report prop names', () => {
    const component = {
      ...createComponent(),
      props: [],
    }

    const result = joinMcpComponent(component, {
      ...createDocument(),
      members: [
        createDocument().members[0]!,
        {
          id: 'size',
          name: 'size',
          kind: 'property',
          optional: true,
          readonly: false,
          declaredBy: { id: 'recipe-variant-props', name: 'RecipeVariantProps' },
          semanticKind: 'property' as never,
          typeLabel: 'Union',
          type: {
            kind: 'union',
            types: [
              { kind: 'literal', value: '"sm"' },
              { kind: 'literal', value: '"md"' },
              { kind: 'literal', value: '"lg"' },
            ],
          },
          jsDoc: {
            summary: 'Button size',
            tags: [],
          },
          summary: {
            description: 'Controls the recipe size',
            paramDocs: [],
          },
        },
      ],
    })

    expect(result.props).toMatchObject([
      {
        name: 'variant',
        count: 0,
        usage: 'unused',
        type: '"solid" | "ghost"',
        description: 'Controls visual treatment',
      },
      // `size` is a style prop in the compiler vocabulary; recipe variants sharing the name are a known follow-up.
      {
        name: 'size',
        count: 0,
        usage: 'unused',
        type: '"sm" | "md" | "lg"',
        description: 'Controls the recipe size',
        origin: 'documented',
        styleProp: true,
      },
    ])
  })
})

describe('toMcpReferenceData', () => {
  it('formats reference diagnostics as one-line warnings', () => {
    expect(toMcpReferenceData(createDocument()).warnings).toEqual([
      './src/components/Button.tsx:4:3 TST-W-DUPLICATE-MEMBER duplicate member variant',
    ])
  })
})
