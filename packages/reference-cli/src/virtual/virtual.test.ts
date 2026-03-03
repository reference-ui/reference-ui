import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { existsSync } from 'node:fs'
import { runInitialCopy } from './logic'
import { clearConfig, setConfig } from '../config'
import { getOutDirPath, getVirtualDirPath } from '../lib/paths'

vi.mock('../lib/event-bus', () => ({
  emit: vi.fn(),
}))

describe('virtual', () => {
  let tmpDir: string

  beforeEach(async () => {
    clearConfig()
    tmpDir = await mkdtemp(join(tmpdir(), 'ref-ui-virtual-test-'))
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  describe('paths', () => {
    it('getOutDirPath returns .reference-ui by default', () => {
      expect(getOutDirPath('/project/root')).toBe('/project/root/.reference-ui')
    })

    it('getOutDirPath uses config.outDir when set', () => {
      setConfig({ name: 'test', include: [], outDir: '.my-output' })
      expect(getOutDirPath('/project/root')).toBe('/project/root/.my-output')
    })

    it('getVirtualDirPath returns .reference-ui/virtual by default', () => {
      expect(getVirtualDirPath('/project/root')).toBe('/project/root/.reference-ui/virtual')
    })

    it('getVirtualDirPath uses config.outDir when set', () => {
      setConfig({ name: 'test', include: [], outDir: '.my-output' })
      expect(getVirtualDirPath('/project/root')).toBe('/project/root/.my-output/virtual')
    })
  })

  describe('runInitialCopy', () => {
    it('creates .reference-ui/virtual and copies files matching include', async () => {
      const srcDir = join(tmpDir, 'src')
      await mkdir(srcDir, { recursive: true })
      await writeFile(join(srcDir, 'App.tsx'), 'export const App = () => null')
      await writeFile(join(srcDir, 'index.ts'), 'export {}')
      await writeFile(join(tmpDir, 'ignore.txt'), 'not included')

      await runInitialCopy({
        sourceDir: tmpDir,
        config: {
          name: 'test',
          include: ['src/**/*.{ts,tsx}'],
        },
      })

      const virtualDir = getVirtualDirPath(tmpDir)
      expect(existsSync(virtualDir)).toBe(true)

      const appPath = join(virtualDir, 'src', 'App.tsx')
      const indexPath = join(virtualDir, 'src', 'index.ts')

      expect(existsSync(appPath)).toBe(true)
      expect(existsSync(indexPath)).toBe(true)
      expect(await readFile(appPath, 'utf-8')).toBe('export const App = () => null')
      expect(await readFile(indexPath, 'utf-8')).toBe('export {}')

      // ignore.txt should not be copied (not in include)
      expect(existsSync(join(virtualDir, 'ignore.txt'))).toBe(false)
    })

    it('excludes node_modules and .reference-ui from copy', async () => {
      await mkdir(join(tmpDir, 'src'), { recursive: true })
      await writeFile(join(tmpDir, 'src', 'foo.tsx'), 'x')
      await mkdir(join(tmpDir, 'node_modules', 'pkg'), { recursive: true })
      await writeFile(join(tmpDir, 'node_modules', 'pkg', 'index.js'), 'internal')
      await mkdir(join(tmpDir, '.reference-ui', 'cache'), { recursive: true })
      await writeFile(join(tmpDir, '.reference-ui', 'cache', 'x'), 'cache')

      await runInitialCopy({
        sourceDir: tmpDir,
        config: {
          name: 'test',
          include: ['**/*.{ts,tsx,js}'],
        },
      })

      const virtualDir = getVirtualDirPath(tmpDir)
      expect(existsSync(join(virtualDir, 'src', 'foo.tsx'))).toBe(true)
      expect(existsSync(join(virtualDir, 'node_modules', 'pkg', 'index.js'))).toBe(false)
      expect(existsSync(join(virtualDir, '.reference-ui', 'cache', 'x'))).toBe(false)
    })

    it('uses config.outDir when specified', async () => {
      const config = {
        name: 'test',
        include: ['src/**/*.{ts,tsx}'],
        outDir: '.my-output',
      }
      setConfig(config)

      const srcDir = join(tmpDir, 'src')
      await mkdir(srcDir, { recursive: true })
      await writeFile(join(srcDir, 'Bar.tsx'), 'export const Bar = () => null')

      await runInitialCopy({
        sourceDir: tmpDir,
        config,
      })

      const virtualDir = getVirtualDirPath(tmpDir)
      expect(existsSync(virtualDir)).toBe(true)
      expect(existsSync(join(virtualDir, 'src', 'Bar.tsx'))).toBe(true)
    })

    it('handles empty include patterns', async () => {
      await mkdir(join(tmpDir, 'src'), { recursive: true })
      await writeFile(join(tmpDir, 'src', 'foo.tsx'), 'x')

      await runInitialCopy({
        sourceDir: tmpDir,
        config: {
          name: 'test',
          include: [],
        },
      })

      const virtualDir = getVirtualDirPath(tmpDir)
      expect(existsSync(virtualDir)).toBe(true)
      // No files copied
      expect(existsSync(join(virtualDir, 'src', 'foo.tsx'))).toBe(false)
    })
  })
})
