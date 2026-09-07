import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { existsSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { GlobalProjectRegistry } from './global-registry'

describe('GlobalProjectRegistry', () => {
  let testDir: string
  let registryFile: string

  beforeEach(() => {
    const rawTestDir = join(tmpdir(), `ref-test-registry-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(rawTestDir, { recursive: true })
    testDir = realpathSync(rawTestDir)
    registryFile = join(testDir, 'registry.json')
    GlobalProjectRegistry.setRegistryPathForTesting(registryFile)
  })

  afterEach(() => {
    GlobalProjectRegistry.setRegistryPathForTesting(null)
    rmSync(testDir, { recursive: true, force: true })
  })

  it('returns empty when registry file does not exist', () => {
    const result = GlobalProjectRegistry.read()
    expect(result.projects).toEqual({})
    expect(result.sanitizedCount).toBe(0)
  })

  it('upserts a project with valid ui.config.ts', () => {
    const projectDir = join(testDir, 'my-project')
    mkdirSync(projectDir, { recursive: true })
    const configPath = join(projectDir, 'ui.config.ts')
    writeFileSync(configPath, 'export default {}')

    GlobalProjectRegistry.upsert(projectDir)

    const result = GlobalProjectRegistry.read()
    const keys = Object.keys(result.projects)
    expect(keys.length).toBe(1)
    expect(result.projects[keys[0]].configPath).toBe(configPath)
    expect(typeof result.projects[keys[0]].lastActive).toBe('string')
  })

  it('prunes stale project paths where config no longer exists', () => {
    const project1 = join(testDir, 'proj1')
    const project2 = join(testDir, 'proj2')
    mkdirSync(project1, { recursive: true })
    mkdirSync(project2, { recursive: true })
    const config1 = join(project1, 'ui.config.ts')
    const config2 = join(project2, 'ui.config.ts')
    writeFileSync(config1, 'export default {}')
    writeFileSync(config2, 'export default {}')

    GlobalProjectRegistry.upsert(project1)
    GlobalProjectRegistry.upsert(project2)

    expect(Object.keys(GlobalProjectRegistry.read().projects).length).toBe(2)

    // Delete proj1
    rmSync(project1, { recursive: true, force: true })

    const res = GlobalProjectRegistry.read()
    expect(res.sanitizedCount).toBe(1)
    expect(Object.keys(res.projects).length).toBe(1)
    expect(res.projects[Object.keys(res.projects)[0]].configPath).toBe(config2)
  })

  it('heals gracefully from corrupted JSON file', () => {
    writeFileSync(registryFile, '{ invalid json @@')
    const result = GlobalProjectRegistry.read()
    expect(result.projects).toEqual({})
    expect(result.sanitizedCount).toBe(0)
    expect(existsSync(`${registryFile}.bak`)).toBe(true)
  })
})
