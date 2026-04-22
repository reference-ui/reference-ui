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
    const cliDir = createTempDir()
    const projectCwd = createTempDir()
    const tempDir = resolve(projectCwd, '.reference-ui/react/.ref-ui-dts-test')
    mkdirSync(tempDir, { recursive: true })
    mkdirSync(cliDir, { recursive: true })

    const tempTsconfigPath = createTempTsconfig({ cliDir, projectCwd, tempDir })
    const config = JSON.parse(readFileSync(tempTsconfigPath, 'utf-8')) as {
      extends?: string
      compilerOptions: {
        declaration?: boolean
        emitDeclarationOnly?: boolean
        noEmit?: boolean
        paths: Record<string, string[]>
        preserveValueImports?: boolean
      }
    }

    expect(config.extends).toBe(resolve(cliDir, 'tsconfig.json'))
    expect(config.compilerOptions.declaration).toBe(true)
    expect(config.compilerOptions.emitDeclarationOnly).toBe(true)
    expect(config.compilerOptions.noEmit).toBeUndefined()
    expect(config.compilerOptions.preserveValueImports).toBeUndefined()
    const styledDir = resolve(projectCwd, '.reference-ui/styled')
    expect(config.compilerOptions.paths['@reference-ui/styled']).toEqual([
      relative(tempDir, styledDir).replaceAll('\\', '/'),
    ])
    expect(config.compilerOptions.paths['@reference-ui/styled/*']).toEqual([
      `${relative(tempDir, styledDir).replaceAll('\\', '/')}/*`,
    ])
  })
})