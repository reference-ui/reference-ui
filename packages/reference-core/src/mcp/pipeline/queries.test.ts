import { describe, expect, it } from 'vitest'

import { DEFAULT_OUT_DIR } from '../../constants'
import type { McpBuildArtifact } from './types'
import {
  compactComponent,
  findComponent,
  getComponentProps,
  listComponents,
  listTokens,
} from './queries'
import { createObservedReferenceUiPrimitives } from './primitives'

const EXPECTED_USAGE_SEMANTICS = {
  count: 'Number of resolved JSX opening-element occurrences in the analyzed files.',
  usage:
    'Relative usage bucket derived from count using the same Reference UI usage thresholds across component tools.',
}

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
        kind: 'project',
        source: './src/components/Button.tsx',
        usage: 'very common',
        count: 8,
        usageSemantics: EXPECTED_USAGE_SEMANTICS,
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

  it('falls back to documented Reference UI primitives on direct lookup when they were not observed', () => {
    expect(findComponent(artifact, { name: 'Canvas' })).toEqual(
      expect.objectContaining({
        name: 'Canvas',
        kind: 'primitive',
        source: '@reference-ui/react',
        count: 0,
        usage: 'unused',
        interface: expect.objectContaining({
          name: 'CanvasProps',
          source: '@reference-ui/react',
        }),
      })
    )
  })

  it('returns compact component props without inherited style prop noise', () => {
    const component = findComponent(artifact, { name: 'Button' })
    expect(component).not.toBeNull()

    const compact = compactComponent(component!)

    expect(compact.props.map(prop => prop.name)).toEqual(['variant'])
    expect(compact.kind).toBe('project')
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
    expect(listTokens(artifact, { category: 'colors' })).toEqual({
      tokens: [
        {
          path: 'colors.text',
          category: 'colors',
          value: '#111111',
          description: 'Primary text color',
        },
      ],
      total: 1,
      returned: 1,
      compressed: false,
    })
    expect(listTokens(artifact, { query: 'md' })).toEqual({
      tokens: [
        {
          path: 'spacing.md',
          category: 'spacing',
          value: '1rem',
        },
      ],
      total: 1,
      returned: 1,
      compressed: false,
    })
  })

  it('compresses large token results without dropping token names', () => {
    const tokens = Array.from({ length: 201 }, (_, index) => ({
      path: `colors.gray.${index}`,
      category: 'colors',
      value: String(index),
      description: `Gray ${index}`,
    }))

    expect(
      listTokens({
        ...artifact,
        tokens,
      })
    ).toEqual({
      tokens: tokens.map(token => ({
        path: token.path,
        category: token.category,
        value: token.value,
        light: undefined,
        dark: undefined,
      })),
      total: 201,
      returned: 201,
      compressed: true,
      message:
        'Token output compressed to paths, categories, and raw values because the result set is large. Query a token path for descriptions and richer metadata.',
    })
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
        kind: 'project',
        source: './src/components/ThemeToggle.tsx',
        usage: 'unused',
        count: 0,
        usageSemantics: EXPECTED_USAGE_SEMANTICS,
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

  it('includes observed Reference UI primitives as component tool targets', () => {
    const observedArtifact = {
      ...artifact,
      components: createObservedReferenceUiPrimitives([
        {
          name: 'Div',
          count: 2,
          examples: ['<Div />'],
          filePresence: 1,
          propCounts: { children: 1, p: 1 },
          usedWithCounts: {},
        },
        {
          name: 'Code',
          count: 1,
          examples: ['<Code>src/App.tsx</Code>'],
          filePresence: 1,
          propCounts: { children: 1 },
          usedWithCounts: {},
        },
      ]),
    }
    const listed = listComponents(observedArtifact, { source: '@reference-ui/react', limit: 100 })
    const names = listed.map(component => component.name)

    expect(names.filter(name => name === 'Div')).toHaveLength(1)
    expect(names.filter(name => name === 'Code')).toHaveLength(1)
    expect(names).not.toContain('Main')

    expect(findComponent(observedArtifact, { name: 'Div' })).toEqual(
      expect.objectContaining({
        name: 'Div',
        kind: 'primitive',
        count: 2,
      })
    )
    expect(getComponentProps(observedArtifact, { name: 'Div', includeStyleProps: false })?.props).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'children', styleProp: false }),
      ])
    )
  })

  it('does not expose unused Reference UI primitives as static catalog entries', () => {
    expect(listComponents({ ...artifact, components: [] }, { query: 'Div' })).toEqual([])
    expect(findComponent({ ...artifact, components: [] }, { name: 'Div' })).toEqual(
      expect.objectContaining({
        name: 'Div',
        source: '@reference-ui/react',
        kind: 'primitive',
        count: 0,
        usage: 'unused',
      })
    )
    expect(getComponentProps(
      { ...artifact, components: [] },
      { name: 'Div', source: '@reference-ui/react', includeStyleProps: false }
    )?.props).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'children', origin: 'documented', styleProp: false }),
      ])
    )
  })
})
