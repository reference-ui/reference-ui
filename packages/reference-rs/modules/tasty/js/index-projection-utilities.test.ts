/**
 * Tests for member projection through Omit, Pick, and Pretty.
 * Tests member projection through utility types: Omit, Pick and Pretty over an intersection, and a
 * Pretty of a Parameters type-query. Each case builds its manifest inline, with no compile.
 */
import { describe, expect, it } from 'vitest'

import type { RawTastyManifest } from './api-types.js'
import { createTastyApiFromManifest } from './index.js'

describe('tasty runtime', () => {
  it('projects utility-based intersections when a utility type is referenced through a re-exporting library', async () => {
    const manifest: RawTastyManifest = {
      version: '2',
      warnings: [],
      symbolsByName: {
        ButtonProps: ['button'],
        'React.ComponentPropsWithoutRef': ['componentPropsWithoutRef'],
        RecipeVariantProps: ['recipeVariantProps'],
      },
      symbolsById: {
        button: {
          id: 'button',
          name: 'ButtonProps',
          kind: 'typeAlias',
          chunk: './chunks/button.js',
          library: 'user',
        },
        componentPropsWithoutRef: {
          id: 'componentPropsWithoutRef',
          name: 'React.ComponentPropsWithoutRef',
          kind: 'typeAlias',
          chunk: './chunks/component-props-without-ref.js',
          library: 'user',
        },
        recipeVariantProps: {
          id: 'recipeVariantProps',
          name: 'RecipeVariantProps',
          kind: 'typeAlias',
          chunk: './chunks/recipe-variant-props.js',
          library: '@reference-ui/styled',
        },
      },
    }

    const chunks = {
      './chunks/button.js': {
        button: {
          id: 'button',
          name: 'ButtonProps',
          library: 'user',
          definition: {
            kind: 'intersection',
            types: [
              {
                id: 'React.ComponentPropsWithoutRef',
                name: 'React.ComponentPropsWithoutRef',
                library: 'user',
                typeArguments: [{ kind: 'type_query', expression: 'ButtonPrimitive' }],
              },
              {
                id: 'RecipeVariantProps',
                name: 'RecipeVariantProps',
                library: '@reference-ui/react',
                typeArguments: [{ kind: 'type_query', expression: 'buttonRecipe' }],
              },
            ],
          },
        },
      },
      './chunks/component-props-without-ref.js': {
        componentPropsWithoutRef: {
          id: 'componentPropsWithoutRef',
          name: 'React.ComponentPropsWithoutRef',
          library: 'user',
          definition: {
            kind: 'object',
            members: [
              {
                name: 'disabled',
                optional: true,
                readonly: false,
                kind: 'property',
                type: { kind: 'intrinsic', name: 'boolean' },
              },
              {
                name: 'className',
                optional: true,
                readonly: false,
                kind: 'property',
                type: { kind: 'intrinsic', name: 'string' },
              },
            ],
          },
        },
      },
      './chunks/recipe-variant-props.js': {
        recipeVariantProps: {
          id: 'recipeVariantProps',
          name: 'RecipeVariantProps',
          library: '@reference-ui/styled',
          definition: {
            kind: 'object',
            members: [
              {
                name: 'visual',
                optional: true,
                readonly: false,
                kind: 'property',
                type: { kind: 'intrinsic', name: 'string' },
              },
              {
                name: 'size',
                optional: true,
                readonly: false,
                kind: 'property',
                type: { kind: 'intrinsic', name: 'string' },
              },
            ],
          },
        },
      },
    } as const

    const api = createTastyApiFromManifest({
      manifest,
      importer: async artifactPath => chunks[artifactPath as keyof typeof chunks],
    })

    const buttonProps = await api.loadSymbolByName('ButtonProps')
    const displayMembers = await api.graph.getDisplayMembers(buttonProps)

    expect(displayMembers.map(member => member.getName())).toEqual([
      'disabled',
      'className',
      'visual',
      'size',
    ])
  })

  it('projects Pretty<Parameters<typeof recipe>[0]> through resolved type-query call signatures', async () => {
    const manifest: RawTastyManifest = {
      version: '2',
      warnings: [],
      symbolsByName: {
        ButtonProps: ['button'],
        RecipeVariantProps: ['recipeVariantProps'],
      },
      symbolsById: {
        button: {
          id: 'button',
          name: 'ButtonProps',
          kind: 'typeAlias',
          chunk: './chunks/button.js',
          library: 'user',
        },
        recipeVariantProps: {
          id: 'recipeVariantProps',
          name: 'RecipeVariantProps',
          kind: 'typeAlias',
          chunk: './chunks/recipe-variant-props.js',
          library: '@reference-ui/styled',
        },
      },
    }

    const chunks = {
      './chunks/button.js': {
        button: {
          id: 'button',
          name: 'ButtonProps',
          library: 'user',
          definition: {
            id: 'RecipeVariantProps',
            name: 'RecipeVariantProps',
            library: '@reference-ui/react',
            typeArguments: [
              {
                kind: 'type_query',
                expression: 'buttonRecipe',
                resolved: {
                  kind: 'function',
                  params: [
                    {
                      name: 'props',
                      optional: true,
                      typeRef: {
                        kind: 'object',
                        members: [
                          {
                            name: 'visual',
                            optional: true,
                            readonly: false,
                            kind: 'property',
                            type: {
                              kind: 'union',
                              types: [
                                { kind: 'literal', value: "'solid'" },
                                { kind: 'literal', value: "'ghost'" },
                              ],
                            },
                          },
                          {
                            name: 'size',
                            optional: true,
                            readonly: false,
                            kind: 'property',
                            type: {
                              kind: 'union',
                              types: [
                                { kind: 'literal', value: "'sm'" },
                                { kind: 'literal', value: "'md'" },
                              ],
                            },
                          },
                        ],
                      },
                    },
                  ],
                  returnType: { kind: 'intrinsic', name: 'string' },
                },
              },
            ],
          },
        },
      },
      './chunks/recipe-variant-props.js': {
        recipeVariantProps: {
          id: 'recipeVariantProps',
          name: 'RecipeVariantProps',
          library: '@reference-ui/styled',
          definition: {
            id: 'Pretty',
            name: 'Pretty',
            library: './system-types',
            typeArguments: [
              {
                kind: 'indexed_access',
                object: {
                  id: 'Parameters',
                  name: 'Parameters',
                  library: '@reference-ui/styled/types/recipe',
                  typeArguments: [
                    {
                      kind: 'type_query',
                      expression: 'buttonRecipe',
                      resolved: {
                        kind: 'function',
                        params: [
                          {
                            name: 'props',
                            optional: true,
                            typeRef: {
                              kind: 'object',
                              members: [
                                {
                                  name: 'visual',
                                  optional: true,
                                  readonly: false,
                                  kind: 'property',
                                  type: {
                                    kind: 'union',
                                    types: [
                                      { kind: 'literal', value: "'solid'" },
                                      { kind: 'literal', value: "'ghost'" },
                                    ],
                                  },
                                },
                                {
                                  name: 'size',
                                  optional: true,
                                  readonly: false,
                                  kind: 'property',
                                  type: {
                                    kind: 'union',
                                    types: [
                                      { kind: 'literal', value: "'sm'" },
                                      { kind: 'literal', value: "'md'" },
                                    ],
                                  },
                                },
                              ],
                            },
                          },
                        ],
                        returnType: { kind: 'intrinsic', name: 'string' },
                      },
                    },
                  ],
                },
                index: { kind: 'literal', value: '0' },
              },
            ],
          },
        },
      },
    } as const

    const api = createTastyApiFromManifest({
      manifest,
      importer: async artifactPath => chunks[artifactPath as keyof typeof chunks],
    })

    const buttonProps = await api.loadSymbolByName('ButtonProps')
    const displayMembers = await api.graph.getDisplayMembers(buttonProps)

    expect(displayMembers.map(member => member.getName())).toEqual(['visual', 'size'])
  })
})
