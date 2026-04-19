import { beforeEach, describe, expect, it, vi } from 'vitest'

const analyzeDetailed = vi.fn()
const createReferenceApi = vi.fn(() => ({}))
const loadMcpReferenceData = vi.fn(async () => null)
const writeMcpArtifact = vi.fn(async () => '/tmp/model.json')
const getConfig = vi.fn()
const existsSync = vi.fn(() => true)

vi.mock('node:fs', () => ({
  existsSync,
}))

vi.mock('@reference-ui/rust/atlas', () => ({
  analyzeDetailed,
}))

vi.mock('../../config', () => ({
  getConfig,
}))

vi.mock('./reference', () => ({
  createReferenceApi,
  loadMcpReferenceData,
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
    })
    expect(loadMcpReferenceData).toHaveBeenCalledWith(
      {},
      'ButtonProps',
      './src/components/Button.tsx'
    )
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
      'MCP build requires generated types manifest at "/tmp/types/tasty/manifest.js". Run ref sync first.'
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
})
