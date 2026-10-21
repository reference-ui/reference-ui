// Vitest tests for the MCP artifact build.
// They take fixture projects and assert the built model plus cache and prefetch behavior, including the truncated
// mark and the projection warning a component whose tasty projection ran out of steps carries into the model.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { McpReferenceData } from './reference'
import { REFERENCE_UI_PRIMITIVE_NAMES } from './primitives'

const analyzeDetailed = vi.fn()
const createReferenceApi = vi.fn(() => ({}))
const loadMcpReferenceData = vi.fn(async (): Promise<McpReferenceData | null> => null)
const loadMcpTokens = vi.fn(async () => [])
const writeMcpArtifact = vi.fn(async () => '/tmp/model.json')
const getConfig = vi.fn()
const existsSync = vi.fn(() => true)

vi.mock('node:fs', () => ({
  existsSync,
}))

vi.mock('@reference-ui/rust/atlas', () => ({
  analyzeDetailed,
}))

vi.mock('@reference-ui/core/config/store', () => ({
  getConfig,
}))

vi.mock('./reference', () => ({
  createReferenceApi,
  loadMcpReferenceData,
}))

vi.mock('./tokens', () => ({
  loadMcpTokens,
}))

vi.mock('./artifact', () => ({
  readMcpArtifact: vi.fn(),
  writeMcpArtifact,
}))

vi.mock('./paths', async () => {
  const actual = await vi.importActual<typeof import('./paths')>('./paths')
  return {
    ...actual,
    getMcpTypesManifestPath: () => '/tmp/types/tasty/manifest.js',
    getMcpModelPath: () => '/tmp/mcp/model.json',
  }
})

describe('buildMcpArtifact', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    existsSync.mockReturnValue(true)
    getConfig.mockReturnValue({
      name: 'test-system',
      include: ['src/**/*.{ts,tsx}'],
      mcp: {
        include: ['src/components/**'],
        exclude: ['src/components/internal/**'],
      },
    })
    analyzeDetailed.mockResolvedValue({
      components: [
        {
          name: 'Button',
          source: './src/components/Button.tsx',
          count: 2,
          props: [],
          usage: 'common',
          examples: [],
          usedWith: {},
          interface: { name: 'ButtonProps', source: './src/components/Button.tsx' },
        },
      ],
      diagnostics: [],
    })
  })

  it('passes config.mcp include/exclude directly to Atlas', async () => {
    const { buildMcpArtifact } = await import('./build')

    await buildMcpArtifact({ cwd: '/workspace/app', force: true })

    expect(analyzeDetailed).toHaveBeenCalledWith('/workspace/app', {
      rootDir: '',
      include: ['src/components/**'],
      exclude: ['src/components/internal/**'],
      observe: [{ source: '@reference-ui/react', names: REFERENCE_UI_PRIMITIVE_NAMES }],
    })
    expect(loadMcpReferenceData).toHaveBeenCalledWith(
      {},
      'ButtonProps',
      './src/components/Button.tsx',
      'Button'
    )
    expect(loadMcpTokens).toHaveBeenCalledWith(
      '/workspace/app',
      expect.objectContaining({ name: 'test-system' })
    )
  })

  it('builds primitive components from the observed elements Atlas returns', async () => {
    analyzeDetailed.mockResolvedValueOnce({
      components: [],
      diagnostics: [],
      observed: [
        {
          name: 'Button',
          source: '@reference-ui/react',
          count: 3,
          usage: 'very common',
          examples: ['<Button disabled />'],
          filePresence: 1,
          props: [
            { name: 'disabled', count: 1, usage: 'occasional', values: { true: 'occasional' } },
          ],
          usedWith: {},
        },
      ],
    })
    const { generateMcpArtifact } = await import('./build')

    const artifact = await generateMcpArtifact({ cwd: '/workspace/observed-app' })

    expect(artifact.components.find(component => component.name === 'Button')).toMatchObject({
      kind: 'primitive',
      count: 3,
      usage: 'very common',
      examples: ['<Button disabled />'],
      props: expect.arrayContaining([
        expect.objectContaining({
          name: 'disabled',
          count: 1,
          origin: 'observed',
          values: { true: 'occasional' },
        }),
      ]),
    })
  })

  it('separates MCP generation from artifact writing', async () => {
    const { buildMcpArtifact, generateMcpArtifact } = await import('./build')

    const generated = await generateMcpArtifact({ cwd: '/workspace/app', force: true })

    expect(writeMcpArtifact).not.toHaveBeenCalled()

    await buildMcpArtifact({ cwd: '/workspace/app', force: true })

    expect(writeMcpArtifact).toHaveBeenCalledWith(
      '/workspace/app',
      expect.objectContaining({
        schemaVersion: generated.schemaVersion,
        workspaceRoot: generated.workspaceRoot,
        manifestPath: generated.manifestPath,
        diagnostics: generated.diagnostics,
        components: generated.components,
      })
    )
  })

  it('fails clearly when the generated types manifest is missing', async () => {
    const { generateMcpArtifact } = await import('./build')
    existsSync.mockReturnValue(false)

    await expect(generateMcpArtifact({ cwd: '/workspace/app' })).rejects.toThrow(
      'MCP build requires generated Reference UI artifacts at "/tmp/types/tasty/manifest.js". Run "ref sync" from the project root before starting the MCP server.'
    )

    expect(analyzeDetailed).not.toHaveBeenCalled()
    expect(writeMcpArtifact).not.toHaveBeenCalled()
  })

  it('fails clearly when generated type enrichment is malformed', async () => {
    const { generateMcpArtifact } = await import('./build')
    loadMcpReferenceData.mockRejectedValueOnce(new Error('Corrupt Tasty member payload'))

    await expect(generateMcpArtifact({ cwd: '/workspace/app' })).rejects.toThrow(
      'MCP enrichment failed for interface "ButtonProps" (./src/components/Button.tsx): Corrupt Tasty member payload'
    )

    expect(writeMcpArtifact).not.toHaveBeenCalled()
  })

  it('marks a component whose projection was cut, and warns once per notice with its name', async () => {
    const budgetNotice =
      'Member projection of "ButtonProps" stopped after 10000 steps; inherited members past that point may be omitted.'
    const depthNotice =
      'Member projection of "ButtonProps" stopped at nesting depth 32; members of types nested past that point may be omitted.'
    loadMcpReferenceData.mockResolvedValueOnce({
      description: null,
      members: [],
      warnings: [],
      projectionNotices: [budgetNotice, depthNotice],
    })
    const { generateMcpArtifact } = await import('./build')

    const artifact = await generateMcpArtifact({ cwd: '/workspace/app' })

    expect(artifact.components.find(component => component.name === 'Button')).toMatchObject({
      truncated: true,
    })
    expect(artifact.diagnostics).toEqual([
      expect.objectContaining({
        severity: 'warning',
        code: 'TST-W-PROJECTION-BUDGET',
        message: `Button (./src/components/Button.tsx): ${budgetNotice}`,
      }),
      expect.objectContaining({
        severity: 'warning',
        code: 'TST-W-PROJECTION-BUDGET',
        message: `Button (./src/components/Button.tsx): ${depthNotice}`,
      }),
    ])
  })

  it('adds neither the mark nor a warning for a component whose projection completed', async () => {
    const { generateMcpArtifact } = await import('./build')

    const artifact = await generateMcpArtifact({ cwd: '/workspace/app' })

    expect(artifact.components.find(component => component.name === 'Button')).not.toHaveProperty(
      'truncated'
    )
    expect(artifact.diagnostics).toEqual([])
  })
})
