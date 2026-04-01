import { performance } from 'node:perf_hooks'
import { join, resolve } from 'node:path'
import { analyzeDetailed } from '@reference-ui/rust/atlas'
import { beforeAll, describe, expect, it } from 'vitest'
import {
  clearMcpAtlasCache,
  generateMcpArtifact,
  generateMcpArtifactFromAtlas,
  prefetchMcpAtlas,
} from '../../../reference-core/src/mcp/build'
import { joinMcpComponent } from '../../../reference-core/src/mcp/join'
import {
  createReferenceApi,
  loadReferenceDocument,
} from '../../../reference-core/src/mcp/reference'
import { referenceUnitRoot, runRefSync } from './helpers'

const referenceDocsRoot = resolve(referenceUnitRoot, '..', 'reference-docs')
const manifestPath = join(referenceDocsRoot, '.reference-ui', 'types', 'tasty', 'manifest.js')

describe('mcp generation performance', () => {
  beforeAll(() => {
    runRefSync(referenceDocsRoot)
  }, 180_000)

  it('beats the legacy docs-oriented MCP projection path on a real workspace', async () => {
    const atlas = await analyzeDetailed(referenceDocsRoot)

    const buildLegacy = async () => {
      const api = createReferenceApi(manifestPath)
      const components = await Promise.all(
        atlas.components.map(async component => {
          const document = component.interface?.name
            ? await loadReferenceDocument(
                api,
                component.interface.name,
                component.interface.source
              )
            : null
          return joinMcpComponent(component, document)
        })
      )

      return components.sort((left, right) => {
        if (right.count !== left.count) return right.count - left.count
        if (left.name !== right.name) return left.name.localeCompare(right.name)
        return left.source.localeCompare(right.source)
      })
    }

    const buildOptimized = async () =>
      (
        await generateMcpArtifactFromAtlas({
          cwd: referenceDocsRoot,
          manifestPath,
          atlas,
        })
      ).components

    const warmLegacy = await buildLegacy()
    const warmOptimized = await buildOptimized()

    expect(normalizeComponents(warmOptimized)).toEqual(normalizeComponents(warmLegacy))

    const legacyMs = await measureMedianMs(buildLegacy, 3)
    const optimizedMs = await measureMedianMs(buildOptimized, 3)

    console.info(
      `[mcp perf] legacy=${legacyMs.toFixed(1)}ms optimized=${optimizedMs.toFixed(1)}ms delta=${(
        legacyMs - optimizedMs
      ).toFixed(1)}ms ratio=${(optimizedMs / legacyMs).toFixed(2)}`
    )

    expect(optimizedMs).toBeLessThan(legacyMs)
  }, 180_000)

  it('reuses prefetched Atlas analysis so the final MCP build does less tail work', async () => {
    clearMcpAtlasCache(referenceDocsRoot)

    const coldMs = await measureMedianMs(
      async () => {
        clearMcpAtlasCache(referenceDocsRoot)
        await generateMcpArtifact({ cwd: referenceDocsRoot, force: true })
      },
      2
    )

    const warmedMs = await measurePrefetchedTailMedianMs(referenceDocsRoot, 2)

    console.info(
      `[mcp perf] cold-tail=${coldMs.toFixed(1)}ms prefetched-tail=${warmedMs.toFixed(1)}ms delta=${(
        coldMs - warmedMs
      ).toFixed(1)}ms ratio=${(warmedMs / coldMs).toFixed(2)}`
    )

    expect(warmedMs).toBeLessThan(coldMs)
  }, 180_000)
})

function normalizeComponents(
  components: Array<{
    name: string
    source: string
    props: Array<{
      name: string
      type: string | null
      description: string | null
      optional: boolean
      readonly: boolean
      defaultValue?: string
    }>
  }>
) {
  return components.map(component => ({
    name: component.name,
    source: component.source,
    props: component.props.map(prop => ({
      name: prop.name,
      type: prop.type,
      description: prop.description,
      optional: prop.optional,
      readonly: prop.readonly,
      defaultValue: prop.defaultValue,
    })),
  }))
}

async function measurePrefetchedTailMedianMs(
  cwd: string,
  iterations: number
): Promise<number> {
  const times: number[] = []

  for (let index = 0; index < iterations; index += 1) {
    clearMcpAtlasCache(cwd)
    await prefetchMcpAtlas({ cwd, refresh: true })

    const startedAt = performance.now()
    await generateMcpArtifact({ cwd, force: true })
    times.push(performance.now() - startedAt)
  }

  return getMedianMs(times)
}

async function measureMedianMs<T>(fn: () => Promise<T>, iterations: number): Promise<number> {
  const times: number[] = []

  for (let index = 0; index < iterations; index += 1) {
    const startedAt = performance.now()
    await fn()
    times.push(performance.now() - startedAt)
  }

  return getMedianMs(times)
}

function getMedianMs(times: number[]): number {
  const sorted = [...times].sort((left, right) => left - right)
  return sorted[Math.floor(sorted.length / 2)] ?? Number.POSITIVE_INFINITY
}
