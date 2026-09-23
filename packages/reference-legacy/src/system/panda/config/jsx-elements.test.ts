import { describe, expect, it } from 'vitest'
import { PRIMITIVE_JSX_NAMES } from '../../primitives/tags'
import {
  createResolvedJsxElementsArtifact,
  getResolvedJsxElementsPath,
  getUpstreamJsxElements,
  normalizeAdditionalJsxElements,
  resolvePandaJsxElements,
} from './jsx-elements'

describe('system/panda/config/jsx-elements', () => {
  it('normalizes traced JSX names by trimming, deduping, excluding primitives, and sorting', () => {
    expect(normalizeAdditionalJsxElements([' Div ', 'MyIcon', 'ShellCard', 'MyIcon', '']))
      .toEqual(['MyIcon', 'ShellCard'])
  })

  it('collects upstream jsx elements from extended base systems', () => {
    expect(
      getUpstreamJsxElements([
        { name: 'icons', fragment: 'icons()', jsxElements: ['SearchIcon', 'HomeIcon', 'Div'] },
        { name: 'lib', fragment: 'lib()', jsxElements: ['CardFrame', 'SearchIcon'] },
      ])
    ).toEqual(['CardFrame', 'HomeIcon', 'SearchIcon'])
  })

  it('resolves Panda JSX names from primitives plus upstream/local names', () => {
    expect(resolvePandaJsxElements(['MyIcon', 'ShellCard', 'Div'])).toEqual([
      ...PRIMITIVE_JSX_NAMES,
      'MyIcon',
      'ShellCard',
    ])
  })

  it('creates a stable artifact payload for system output', () => {
    expect(
      createResolvedJsxElementsArtifact({
        upstreamJsxElements: ['SearchIcon', 'HomeIcon', 'Div'],
        localJsxElements: ['ShellCard', 'MyIcon', 'Div'],
      })
    ).toEqual({
      primitives: PRIMITIVE_JSX_NAMES,
      upstream: ['HomeIcon', 'SearchIcon'],
      local: ['MyIcon', 'ShellCard'],
      merged: [...PRIMITIVE_JSX_NAMES, 'HomeIcon', 'MyIcon', 'SearchIcon', 'ShellCard'],
    })
  })

  it('resolves the system JSX artifact path under the sync outDir', () => {
    expect(getResolvedJsxElementsPath('/workspace/app')).toBe(
      '/workspace/app/.reference-ui/system/jsx-elements.json'
    )
  })
})