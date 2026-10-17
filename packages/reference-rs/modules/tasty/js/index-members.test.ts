/**
 * Typescript source file for Reference UI module.
 * Tests symbol relations and documentation over the tasty runtime: inherited members, user-owned
 * dependencies, type-alias helpers over the emitted shape, and jsdoc and signature helpers.
 */
import { join } from 'node:path'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { createTastyApi } from './index.js'
import {
  caseRuntimeDir,
  disposeTastyScratch,
  ensureTastyCaseCompiled,
} from '../tests/harness/helpers.js'

function manifestPath(caseName: string) {
  return join(caseRuntimeDir(caseName), 'manifest.js')
}

describe('tasty runtime', () => {
  beforeAll(async () => {
    await Promise.all([
      ensureTastyCaseCompiled('TST-EXT-01'),
      ensureTastyCaseCompiled('TST-PAR-01'),
      ensureTastyCaseCompiled('TST-DOC-01'),
    ])
  })

  afterAll(disposeTastyScratch)

  it('loads extends symbols and flattens inherited members', async () => {
    const api = createTastyApi({
      manifestPath: manifestPath('TST-EXT-01'),
    })

    const buttonProps = await api.loadSymbolByName('ButtonProps')
    const extendsSymbols = await buttonProps.loadExtendsSymbols()
    const flattened = await api.graph.flattenInterfaceMembers(buttonProps)
    const displayMembers = await api.graph.getDisplayMembers(buttonProps)

    expect(extendsSymbols.map(symbol => symbol.getName())).toEqual(['StyleProps'])
    expect(flattened.map(member => member.getName())).toContain('tone')
    expect(flattened.map(member => member.getName())).toContain('size')
    expect(displayMembers.map(member => member.getName())).toContain('tone')
    expect(displayMembers.map(member => member.getName())).toContain('size')
  })

  it('collects only user-owned immediate dependencies', async () => {
    const api = createTastyApi({
      manifestPath: manifestPath('TST-EXT-01'),
    })

    const buttonProps = await api.loadSymbolByName('ButtonProps')
    const refs = await api.graph.collectUserOwnedReferences(buttonProps)
    const dependencies = await api.graph.loadImmediateDependencies(buttonProps)

    expect(refs.map(ref => ref.getName()).sort()).toEqual(['Size', 'StyleProps'])
    expect(dependencies.map(symbol => symbol.getName()).sort()).toEqual([
      'Size',
      'StyleProps',
    ])
  })

  it('exposes type-alias helpers over the emitted definition shape', async () => {
    const api = createTastyApi({
      manifestPath: manifestPath('TST-PAR-01'),
    })

    const withDefault = await api.loadSymbolByName('WithDefault')
    const underlying = withDefault.getUnderlyingType()
    const defaultType = withDefault.getTypeParameters()[0]?.default

    expect(withDefault.getKind()).toBe('typeAlias')
    expect(withDefault.getTypeParameters()).toHaveLength(1)
    expect(defaultType).toMatchObject({ kind: 'intrinsic' })
    expect(underlying?.getKind()).toBe('object')
    expect(underlying?.describe()).toBe('{ ... }')
  })

  it('exposes clean jsdoc and signature helpers for docs renderers', async () => {
    const api = createTastyApi({
      manifestPath: manifestPath('TST-DOC-01'),
    })

    const buttonProps = await api.loadSymbolByName('ButtonProps')
    const size = buttonProps.getMembers().find(member => member.getName() === 'size')

    expect(buttonProps.getDescription()).toBe(
      'Props for a button.\n\nIncludes common sizing options.'
    )
    expect(buttonProps.getJsDocTags().map(tag => tag.getName())).toEqual([
      'deprecated',
      'remarks',
    ])
    expect(buttonProps.getJsDocTag('deprecated')?.getValue()).toBe(
      'Use NewButtonProps instead.'
    )
    expect(size?.getDescription()).toBe('Preferred size variant.')
    expect(size?.getJsDocTag('default')?.getValue()).toBe('"sm"')
  })
})
