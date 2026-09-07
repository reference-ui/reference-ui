import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { discoverProjects } from './workspace-discovery'
import { GlobalProjectRegistry } from './global-registry'

describe('discoverProjects', () => {
  let testDir: string
  let registryFile: string

  beforeEach(() => {
    const rawTestDir = join(tmpdir(), `ref-test-discovery-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(rawTestDir, { recursive: true })
    testDir = realpathSync(rawTestDir)
    registryFile = join(testDir, 'registry.json')
    GlobalProjectRegistry.setRegistryPathForTesting(registryFile)
  })

  afterEach(() => {
    GlobalProjectRegistry.setRegistryPathForTesting(null)
    rmSync(testDir, { recursive: true, force: true })
  })

  it('detects project in current working directory (Tier 1)', () => {
    const projectDir = join(testDir, 'direct-project')
    mkdirSync(projectDir, { recursive: true })
    writeFileSync(join(projectDir, 'ui.config.ts'), 'export default {}')

    const discovered = discoverProjects(projectDir)
    expect(discovered.some(d => d.source === 'cwd')).toBe(true)
  })

  it('detects ancestor project when called from subdirectory (Tier 2)', () => {
    const projectDir = join(testDir, 'parent-project')
    const subDir = join(projectDir, 'src', 'components', 'button')
    mkdirSync(subDir, { recursive: true })
    writeFileSync(join(projectDir, 'ui.config.ts'), 'export default {}')

    const discovered = discoverProjects(subDir)
    expect(discovered.some(d => d.source === 'ancestor')).toBe(true)
  })

  it('discovers projects from pnpm-workspace.yaml (Tier 3)', () => {
    const monorepoRoot = join(testDir, 'monorepo')
    const pkgA = join(monorepoRoot, 'packages', 'ui')
    const pkgB = join(monorepoRoot, 'apps', 'web')
    mkdirSync(pkgA, { recursive: true })
    mkdirSync(pkgB, { recursive: true })

    writeFileSync(join(pkgA, 'ui.config.ts'), 'export default {}')
    writeFileSync(join(pkgB, 'ui.config.ts'), 'export default {}')

    writeFileSync(
      join(monorepoRoot, 'pnpm-workspace.yaml'),
      `packages:
  - 'packages/*'
  - 'apps/*'
`
    )

    const discovered = discoverProjects(monorepoRoot)
    const sources = discovered.map(d => d.source)
    expect(sources.filter(s => s === 'workspace').length).toBe(2)
  })

  it('strictly excludes node_modules and dot-directories', () => {
    const monorepoRoot = join(testDir, 'monorepo-nm')
    const nmDir = join(monorepoRoot, 'node_modules', 'fake-lib')
    mkdirSync(nmDir, { recursive: true })
    writeFileSync(join(nmDir, 'ui.config.ts'), 'export default {}')

    writeFileSync(
      join(monorepoRoot, 'pnpm-workspace.yaml'),
      `packages:
  - 'node_modules/*'
`
    )

    const discovered = discoverProjects(monorepoRoot)
    expect(discovered.some(d => d.path.includes('node_modules'))).toBe(false)
  })

  it('discovers projects via custom bounded scanPath (Tier 5)', () => {
    const scanRoot = join(testDir, 'scan-root')
    const deeplyNested = join(scanRoot, 'layer1', 'layer2', 'my-pkg')
    mkdirSync(deeplyNested, { recursive: true })
    writeFileSync(join(deeplyNested, 'ui.config.ts'), 'export default {}')

    const discovered = discoverProjects(testDir, { scanPath: scanRoot, maxDepth: 3 })
    expect(discovered.some(d => d.source === 'scan')).toBe(true)
  })
})
