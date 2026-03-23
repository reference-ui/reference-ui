import { mkdtempSync, mkdirSync, writeFileSync, lstatSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

const createdDirs: string[] = []

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'reference-ui-clean-'))
  createdDirs.push(dir)
  return dir
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('../config')
  vi.doUnmock('../lib/paths')
  vi.doUnmock('../lib/log')
  vi.restoreAllMocks()

  for (const dir of createdDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('clean/command', () => {
  it('removes generated outDir and generated package links', async () => {
    const workspaceDir = createTempDir()
    const outDir = resolve(workspaceDir, '.reference-ui')
    const scopeDir = resolve(workspaceDir, 'node_modules', '@reference-ui')

    mkdirSync(resolve(outDir, 'types', 'tasty'), { recursive: true })
    writeFileSync(resolve(outDir, 'types', 'tasty', 'manifest.js'), 'export const manifest = {}\n')

    mkdirSync(scopeDir, { recursive: true })
    mkdirSync(resolve(outDir, 'types'), { recursive: true })
    mkdirSync(resolve(outDir, 'react'), { recursive: true })
    writeFileSync(resolve(outDir, 'types', 'types.mjs'), 'export {}\n')
    writeFileSync(resolve(outDir, 'react', 'react.mjs'), 'export {}\n')

    // Keep workspace package links intact; clean should only remove generated ones.
    mkdirSync(resolve(workspaceDir, 'packages', 'core'), { recursive: true })
    mkdirSync(resolve(workspaceDir, 'packages', 'lib'), { recursive: true })
    writeFileSync(resolve(workspaceDir, 'packages', 'core', 'index.js'), 'export {}\n')
    writeFileSync(resolve(workspaceDir, 'packages', 'lib', 'index.js'), 'export {}\n')
    symlinkSync(resolve(workspaceDir, 'packages', 'core'), resolve(scopeDir, 'core'))
    symlinkSync(resolve(workspaceDir, 'packages', 'lib'), resolve(scopeDir, 'lib'))
    symlinkSync(resolve(outDir, 'types'), resolve(scopeDir, 'types'))
    symlinkSync(resolve(outDir, 'react'), resolve(scopeDir, 'react'))

    vi.doMock('../config', () => ({
      loadUserConfig: async () => ({ outDir: '.reference-ui' }),
      setConfig: vi.fn(),
    }))
    vi.doMock('../lib/paths', () => ({
      getOutDirPath: () => outDir,
    }))
    vi.doMock('../lib/log', () => ({
      log: { debug: vi.fn(), info: vi.fn(), error: vi.fn() },
    }))

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never)
    const { cleanCommand } = await import('./command')

    await cleanCommand(workspaceDir)

    expect(exitSpy).toHaveBeenCalledWith(0)
    expect(() => lstatSync(outDir)).toThrow()
    expect(() => lstatSync(resolve(scopeDir, 'types'))).toThrow()
    expect(() => lstatSync(resolve(scopeDir, 'react'))).toThrow()
    expect(lstatSync(resolve(scopeDir, 'core')).isSymbolicLink()).toBe(true)
    expect(lstatSync(resolve(scopeDir, 'lib')).isSymbolicLink()).toBe(true)
  })
})
