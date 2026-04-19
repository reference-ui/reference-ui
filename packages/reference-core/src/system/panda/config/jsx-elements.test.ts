import { describe, expect, it } from 'vitest'
import { PRIMITIVE_JSX_NAMES } from '../../primitives/tags'
import {
  createResolvedJsxElementsArtifact,
  getResolvedJsxElementsPath,
  normalizeAdditionalJsxElements,
  resolvePandaJsxElements,
} from './jsx-elements'

describe('system/panda/config/jsx-elements', () => {
  it('normalizes traced JSX names by trimming, deduping, excluding primitives, and sorting', () => {
    expect(normalizeAdditionalJsxElements([' Div ', 'MyIcon', 'ShellCard', 'MyIcon', '']))
      .toEqual(['MyIcon', 'ShellCard'])
  })

  it('resolves Panda JSX names from primitives plus traced names', () => {
    expect(resolvePandaJsxElements(['MyIcon', 'ShellCard', 'Div'])).toEqual([
      ...PRIMITIVE_JSX_NAMES,
      'MyIcon',
      'ShellCard',
    ])
  })

  it('creates a stable artifact payload for system output', () => {
    expect(createResolvedJsxElementsArtifact(['ShellCard', 'MyIcon', 'Div'])).toEqual({
      primitives: PRIMITIVE_JSX_NAMES,
      traced: ['MyIcon', 'ShellCard'],
      merged: [...PRIMITIVE_JSX_NAMES, 'MyIcon', 'ShellCard'],
    })
  })

  it('resolves the system JSX artifact path under the sync outDir', () => {
    expect(getResolvedJsxElementsPath('/workspace/app')).toBe(
      '/workspace/app/.reference-ui/system/jsx-elements.json'
    )
  })
})