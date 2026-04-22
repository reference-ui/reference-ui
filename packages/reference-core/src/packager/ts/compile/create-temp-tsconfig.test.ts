import { mkdtempSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { createTempTsconfig } from './create-temp-tsconfig'

const createdDirs: string[] = []

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'reference-ui-create-temp-tsconfig-'))
  createdDirs.push(dir)
  return dir
}

afterEach(() => {
  for (const dir of createdDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('createTempTsconfig', () => {
  it('writes a self-contained compiler baseline for the generated package context', () => {
    const projectCwd = createTempDir()
    const tempDir = resolve(projectCwd, '.reference-ui/react/.ref-ui-dts-test')
    mkdirSync(tempDir, { recursive: true })

    const tempTsconfigPath = createTempTsconfig({ projectCwd, tempDir })
    const config = JSON.parse(readFileSync(tempTsconfigPath, 'utf-8')) as {
      extends?: string
      compilerOptions: {
        baseUrl: string
        moduleResolution: string
        paths: Record<string, string[]>
      }
    }

    expect(config.extends).toBeUndefined()
    expect(config.compilerOptions.baseUrl).toBe('.')
    expect(config.compilerOptions.moduleResolution).toBe('bundler')
    const styledDir = resolve(projectCwd, '.reference-ui/styled')
    expect(config.compilerOptions.paths['@reference-ui/styled']).toEqual([
      relative(tempDir, styledDir).replaceAll('\\', '/'),
    ])
    expect(config.compilerOptions.paths['@reference-ui/styled/*']).toEqual([
      `${relative(tempDir, styledDir).replaceAll('\\', '/')}/*`,
    ])
  })
})