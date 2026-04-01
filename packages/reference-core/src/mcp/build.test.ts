import { beforeEach, describe, expect, it, vi } from 'vitest'

const analyzeDetailed = vi.fn()
const createReferenceApi = vi.fn(() => ({}))
const loadReferenceDocument = vi.fn(async () => null)
const writeMcpArtifact = vi.fn(async () => '/tmp/model.json')
const getConfig = vi.fn()

vi.mock('node:fs', () => ({
  existsSync: () => true,
}))

vi.mock('@reference-ui/rust/atlas', () => ({
  analyzeDetailed,
}))

vi.mock('../config', () => ({
  getConfig,
}))

vi.mock('./reference', () => ({
  createReferenceApi,
  loadReferenceDocument,
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
  })
})
