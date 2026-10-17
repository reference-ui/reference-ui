/**
 * Typescript source file for Reference UI module.
 * Tests how object-like aliases project into members when their inputs are partly opaque, such as
 * an intersection with an unresolved part. Each case builds its manifest inline, with no compile.
 */
import { describe, expect, it } from 'vitest'

import type { RawTastyManifest } from './api-types.js'
import { createTastyApiFromManifest } from './index.js'

describe('tasty runtime', () => {
  it('projects object-like aliases while tolerating partially opaque intersection inputs', async () => {
    const manifest: RawTastyManifest = {
      version: '2',
      warnings: [],
      symbolsByName: {
        BaseProps: ['base'],
        ImportedProjectedProps: ['importedProjected'],
        NestedProjectedProps: ['nestedProjected'],
        PatternProps: ['pattern'],
        OpaqueMappedProps: ['opaqueMapped'],
        PartialProjectedProps: ['partialProjected'],
        ProjectedProps: ['projected'],
        PublicProjectedProps: ['publicProjected'],
      },
      symbolsById: {
        base: {
          id: 'base',
          name: 'BaseProps',
          kind: 'interface',
          chunk: './chunks/base.js',
          library: 'user',
        },
        pattern: {
          id: 'pattern',
          name: 'PatternProps',
          kind: 'typeAlias',
          chunk: './chunks/pattern.js',
          library: 'user',
        },
        importedProjected: {
          id: 'importedProjected',
          name: 'ImportedProjectedProps',
          kind: 'typeAlias',
          chunk: './chunks/imported-projected.js',
          library: 'user',
        },
        nestedProjected: {
          id: 'nestedProjected',
          name: 'NestedProjectedProps',
          kind: 'typeAlias',
          chunk: './chunks/nested-projected.js',
          library: 'user',
        },
        opaqueMapped: {
          id: 'opaqueMapped',
          name: 'OpaqueMappedProps',
          kind: 'typeAlias',
          chunk: './chunks/opaque-mapped.js',
          library: 'user',
        },
        partialProjected: {
          id: 'partialProjected',
          name: 'PartialProjectedProps',
          kind: 'typeAlias',
          chunk: './chunks/partial-projected.js',
          library: 'user',
        },
        projected: {
          id: 'projected',
          name: 'ProjectedProps',
          kind: 'typeAlias',
          chunk: './chunks/projected.js',
          library: 'user',
        },
        publicProjected: {
          id: 'publicProjected',
          name: 'PublicProjectedProps',
          kind: 'typeAlias',
          chunk: './chunks/public-projected.js',
          library: 'user',
        },
      },
    }

    const chunks = {
      './chunks/base.js': {
        base: {
          id: 'base',
          name: 'BaseProps',
          library: 'user',
          members: [
            {
              name: 'tone',
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
              type: { kind: 'intrinsic', name: 'number' },
            },
            {
              name: 'color',
              optional: true,
              readonly: false,
              kind: 'property',
              type: { kind: 'intrinsic', name: 'string' },
            },
          ],
          extends: [],
          types: [],
        },
      },
      './chunks/pattern.js': {
        pattern: {
          id: 'pattern',
          name: 'PatternProps',
          library: 'user',
          definition: {
            kind: 'object',
            members: [
              {
                name: 'gap',
                optional: true,
                readonly: false,
                kind: 'property',
                type: { kind: 'intrinsic', name: 'string' },
              },
            ],
          },
        },
      },
      './chunks/imported-projected.js': {
        importedProjected: {
          id: 'importedProjected',
          name: 'ImportedProjectedProps',
          library: 'user',
          definition: {
            id: 'Omit',
            name: 'Omit',
            library: 'user',
            typeArguments: [
              { id: 'BaseProps', name: 'BaseProps', library: './base' },
              { kind: 'literal', value: "'color'" },
            ],
          },
        },
      },
      './chunks/nested-projected.js': {
        nestedProjected: {
          id: 'nestedProjected',
          name: 'NestedProjectedProps',
          library: 'user',
          definition: {
            id: 'Nested',
            name: 'Nested',
            library: './conditions',
            typeArguments: [{ id: 'base', name: 'BaseProps', library: 'user' }],
          },
        },
      },
      './chunks/projected.js': {
        projected: {
          id: 'projected',
          name: 'ProjectedProps',
          library: 'user',
          definition: {
            kind: 'intersection',
            types: [
              {
                id: 'Omit',
                name: 'Omit',
                library: 'typescript',
                typeArguments: [
                  { id: 'base', name: 'BaseProps', library: 'user' },
                  {
                    kind: 'union',
                    types: [{ kind: 'literal', value: "'color'" }],
                  },
                ],
              },
              { id: 'pattern', name: 'PatternProps', library: 'user' },
            ],
          },
        },
      },
      './chunks/opaque-mapped.js': {
        opaqueMapped: {
          id: 'opaqueMapped',
          name: 'OpaqueMappedProps',
          library: 'user',
          definition: {
            kind: 'mapped',
            typeParam: 'K',
            sourceType: { kind: 'intrinsic', name: 'string' },
            optionalModifier: 'preserve',
            readonlyModifier: 'preserve',
            valueType: { kind: 'intrinsic', name: 'string' },
          },
        },
      },
      './chunks/partial-projected.js': {
        partialProjected: {
          id: 'partialProjected',
          name: 'PartialProjectedProps',
          library: 'user',
          definition: {
            kind: 'intersection',
            types: [
              { id: 'pattern', name: 'PatternProps', library: 'user' },
              { id: 'opaqueMapped', name: 'OpaqueMappedProps', library: 'user' },
            ],
          },
        },
      },
      './chunks/public-projected.js': {
        publicProjected: {
          id: 'publicProjected',
          name: 'PublicProjectedProps',
          library: 'user',
          definition: { id: 'projected', name: 'ProjectedProps', library: 'user' },
        },
      },
    } as const

    const api = createTastyApiFromManifest({
      manifest,
      importer: async artifactPath => chunks[artifactPath as keyof typeof chunks],
    })

    const projected = await api.loadSymbolByName('ProjectedProps')
    const importedProjected = await api.loadSymbolByName('ImportedProjectedProps')
    const nestedProjected = await api.loadSymbolByName('NestedProjectedProps')
    const partialProjected = await api.loadSymbolByName('PartialProjectedProps')
    const publicProjected = await api.loadSymbolByName('PublicProjectedProps')
    const projectedDisplayMembers = await api.graph.getDisplayMembers(projected)
    const importedProjectedDisplayMembers =
      await api.graph.getDisplayMembers(importedProjected)
    const nestedProjectedDisplayMembers =
      await api.graph.getDisplayMembers(nestedProjected)
    const partialProjectedDisplayMembers =
      await api.graph.getDisplayMembers(partialProjected)
    const publicProjectedDisplayMembers =
      await api.graph.getDisplayMembers(publicProjected)
    const projectedMembers = await api.graph.projectObjectLikeMembers(projected)
    const partialProjectedMembers =
      await api.graph.projectObjectLikeMembers(partialProjected)
    const publicProjectedMembers =
      await api.graph.projectObjectLikeMembers(publicProjected)
    const projectedMembersFromSymbol = await projected.getDisplayMembers()
    const partialProjectedMembersFromSymbol = await partialProjected.getDisplayMembers()
    const publicProjectedMembersFromSymbol = await publicProjected.getDisplayMembers()

    expect(projectedDisplayMembers.map(member => member.getName())).toEqual([
      'tone',
      'size',
      'gap',
    ])
    expect(importedProjectedDisplayMembers.map(member => member.getName())).toEqual([
      'tone',
      'size',
    ])
    expect(nestedProjectedDisplayMembers.map(member => member.getName())).toEqual([
      'tone',
      'size',
      'color',
    ])
    expect(partialProjectedDisplayMembers.map(member => member.getName())).toEqual([
      'gap',
    ])
    expect(publicProjectedDisplayMembers.map(member => member.getName())).toEqual([
      'tone',
      'size',
      'gap',
    ])
    expect(projectedMembers?.map(member => member.getName())).toEqual([
      'tone',
      'size',
      'gap',
    ])
    expect(partialProjectedMembers?.map(member => member.getName())).toEqual(['gap'])
    expect(publicProjectedMembers?.map(member => member.getName())).toEqual([
      'tone',
      'size',
      'gap',
    ])
    expect(projectedMembersFromSymbol?.map(member => member.getName())).toEqual([
      'tone',
      'size',
      'gap',
    ])
    expect(partialProjectedMembersFromSymbol?.map(member => member.getName())).toEqual([
      'gap',
    ])
    expect(publicProjectedMembersFromSymbol?.map(member => member.getName())).toEqual([
      'tone',
      'size',
      'gap',
    ])
    expect(projected.getMembers()).toEqual([])
    expect(partialProjected.getMembers()).toEqual([])
    expect(publicProjected.getMembers()).toEqual([])
  })
})
