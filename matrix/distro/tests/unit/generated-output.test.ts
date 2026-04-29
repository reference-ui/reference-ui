import { beforeAll, describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const refUiDir = join(process.cwd(), '.reference-ui')

async function waitForGeneratedFile(relativePath: string, maxMs = 45_000): Promise<string> {
  const absolutePath = join(refUiDir, relativePath)
  const startedAt = Date.now()

  while (Date.now() - startedAt < maxMs) {
    if (existsSync(absolutePath)) {
      return readFileSync(absolutePath, 'utf-8')
    }

    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  throw new Error(`Expected generated file ${relativePath} within ${maxMs}ms`)
}

const generatedOutput = {
  reactBarrel: '',
  reactManifest: null as null | Record<string, unknown>,
  systemBarrel: '',
  systemManifest: null as null | Record<string, unknown>,
}

beforeAll(async () => {
  const [reactManifestContent, systemManifestContent, reactBarrel, systemBarrel] = await Promise.all([
    waitForGeneratedFile(join('react', 'package.json')),
    waitForGeneratedFile(join('system', 'package.json')),
    waitForGeneratedFile(join('react', 'react.d.mts')),
    waitForGeneratedFile(join('system', 'system.d.mts')),
  ])

  generatedOutput.reactManifest = JSON.parse(reactManifestContent) as Record<string, unknown>
  generatedOutput.systemManifest = JSON.parse(systemManifestContent) as Record<string, unknown>
  generatedOutput.reactBarrel = reactBarrel
  generatedOutput.systemBarrel = systemBarrel
})

describe('distro – generated package metadata', () => {
  it('react package advertises react.d.mts as its types entry', () => {
    expect(generatedOutput.reactManifest?.types).toBe('./react.d.mts')
  })

  it('system package advertises system.d.mts as its types entry', () => {
    expect(generatedOutput.systemManifest?.types).toBe('./system.d.mts')
  })

  it('react package exports styles.css as a public subpath', () => {
    expect(generatedOutput.reactManifest?.exports).toMatchObject({
      './styles.css': './styles.css',
    })
  })

  it('system package exports baseSystem as a public subpath', () => {
    expect(generatedOutput.systemManifest?.exports).toMatchObject({
      './baseSystem': {
        import: './baseSystem.mjs',
        types: './baseSystem.d.mts',
      },
    })
  })
})

describe('distro – generated declaration barrels', () => {
  it('react declaration barrel re-exports the generated entry module', () => {
    expect(generatedOutput.reactBarrel).toBe("export * from './entry/react'\n")
  })

  it('system declaration barrel re-exports the generated entry module', () => {
    expect(generatedOutput.systemBarrel).toBe("export * from './entry/system'\n")
  })
})
