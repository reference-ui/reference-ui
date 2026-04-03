import { describe, expect, it } from 'vitest'
import type { McpBuildArtifact } from './types'
import { findComponent, getCommonPatterns, listComponents } from './queries'

const artifact: McpBuildArtifact = {
  schemaVersion: 1,
  generatedAt: '2026-04-01T00:00:00.000Z',
  workspaceRoot: '/workspace/app',
  manifestPath: '/workspace/app/.reference-ui/types/tasty/manifest.js',
  diagnostics: [],
  components: [
    {
      name: 'Button',
      source: './src/components/Button.tsx',
      count: 8,
      usage: 'very common',
      usedWith: { Stack: 'common', Icon: 'occasional' },
      examples: ['<Button />'],
      interface: { name: 'ButtonProps', source: './src/components/Button.tsx' },
      props: [],
    },
    {
      name: 'Card',
      source: '@reference-ui/react',
      count: 3,
      usage: 'common',
      usedWith: { Button: 'common' },
      examples: ['<Card />'],
      interface: { name: 'CardProps', source: '@reference-ui/react' },
      props: [],
    },
  ],
}

describe('mcp queries', () => {
  it('lists summarized components', () => {
    expect(listComponents(artifact, { query: 'but' })).toEqual([
      {
        name: 'Button',
        source: './src/components/Button.tsx',
        usage: 'very common',
        count: 8,
        interfaceName: 'ButtonProps',
        propCount: 0,
      },
    ])
  })

  it('finds a component by name', () => {
    expect(findComponent(artifact, { name: 'Card' })?.source).toBe('@reference-ui/react')
  })

  it('sorts common patterns by usage rank', () => {
    expect(getCommonPatterns(artifact, { name: 'Button' })).toEqual([
      { name: 'Stack', usage: 'common' },
      { name: 'Icon', usage: 'occasional' },
    ])
  })

  it('surfaces a null interface name for components without props annotations', () => {
    expect(
      listComponents(
        {
          ...artifact,
          components: [
            ...artifact.components,
            {
              name: 'ThemeToggle',
              source: './src/components/ThemeToggle.tsx',
              count: 0,
              usage: 'unused',
              usedWith: {},
              examples: ['<ThemeToggle />'],
              interface: null,
              props: [],
            },
          ],
        },
        { query: 'theme' }
      )
    ).toEqual([
      {
        name: 'ThemeToggle',
        source: './src/components/ThemeToggle.tsx',
        usage: 'unused',
        count: 0,
        interfaceName: null,
        propCount: 0,
      },
    ])
  })
})
