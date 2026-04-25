import { describe, expect, it } from 'vitest'

import { DEFAULT_OUT_DIR } from '../../constants'
import type { McpBuildArtifact } from './types'
import {
  compactComponent,
  findComponent,
  getCommonPatterns,
  getComponentProps,
  listComponents,
  listTokens,
} from './queries'

const artifact: McpBuildArtifact = {
  schemaVersion: 1,
  generatedAt: '2026-04-01T00:00:00.000Z',
  workspaceRoot: '/workspace/app',
  manifestPath: `/workspace/app/${DEFAULT_OUT_DIR}/types/tasty/manifest.js`,
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
      props: [
        {
          name: 'variant',
          count: 8,
          usage: 'very common',
          values: { solid: 'common' },
          type: '"solid" | "ghost"',
          description: 'Visual variant',
          optional: false,
          readonly: false,
          origin: 'observed',
          styleProp: false,
        },
        {
          name: 'p',
          count: 0,
          usage: 'unused',
          type: 'StylePropValue<string>',
          description: null,
          optional: true,
          readonly: false,
          origin: 'documented',
          styleProp: true,
        },
      ],
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
  tokens: [
    {
      path: 'colors.text',
      category: 'colors',
      value: '#111111',
      description: 'Primary text color',
    },
    {
      path: 'spacing.md',
      category: 'spacing',
      value: '1rem',
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
        propCount: 2,
        observedProps: ['variant'],
        styleProps: {
          supported: true,
          observed: [],
          tool: 'get_style_props',
          note: 'This component accepts Reference UI StyleProps. Use get_style_props for the shared style prop/token reference.',
        },
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

  it('returns compact component props without inherited style prop noise', () => {
    const component = findComponent(artifact, { name: 'Button' })
    expect(component).not.toBeNull()

    const compact = compactComponent(component!)

    expect(compact.props.map(prop => prop.name)).toEqual(['variant'])
    expect(compact.propSummary).toEqual({
      total: 2,
      observed: 1,
      documented: 1,
      style: 1,
      returned: 1,
    })
    expect(compact.styleProps.supported).toBe(true)
  })

  it('returns full component props with filters', () => {
    const full = getComponentProps(artifact, { name: 'Button' })
    const withoutStyle = getComponentProps(artifact, {
      name: 'Button',
      includeStyleProps: false,
    })

    expect(full?.props.map(prop => prop.name)).toEqual(['variant', 'p'])
    expect(withoutStyle?.props.map(prop => prop.name)).toEqual(['variant'])
  })

  it('lists tokens by category and query', () => {
    expect(listTokens(artifact, { category: 'colors' })).toEqual([
      {
        path: 'colors.text',
        category: 'colors',
        value: '#111111',
        description: 'Primary text color',
      },
    ])
    expect(listTokens(artifact, { query: 'md' })).toEqual([
      {
        path: 'spacing.md',
        category: 'spacing',
        value: '1rem',
      },
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
        observedProps: [],
        styleProps: {
          supported: false,
          observed: [],
          tool: 'get_style_props',
          note: 'No StyleProps surface was detected for this component.',
        },
      },
    ])
  })
})
