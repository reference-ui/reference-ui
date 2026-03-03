import { describe, it, expect, afterEach } from 'vitest'
import { writeFile, readFile, rm, mkdir } from 'node:fs/promises'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, dirname, join, relative, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..')
const virtualDir = join(pkgRoot, '.reference-ui', 'virtual')
const srcDir = join(pkgRoot, 'src')

const virt = (...p: string[]) => join(virtualDir, ...p)

/** Poll until condition is met or timeout. Returns true if condition met. */
async function waitFor(
  fn: () => boolean,
  opts: { intervalMs?: number; timeoutMs?: number } = {}
): Promise<boolean> {
  const { intervalMs = 80, timeoutMs = 4000 } = opts
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (fn()) return true
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  return false
}

/**
 * E2E: ref sync --watch runs in background (test-setup).
 * Tests create new files/dirs in src, watch copies to virtual, we assert.
 */
describe('ref sync – virtual copy (e2e)', () => {
  const createdFiles: string[] = []

  afterEach(async () => {
    for (const f of [...createdFiles].reverse()) {
      try {
        await rm(join(pkgRoot, f), { recursive: true, force: true })
      } catch {
        /* ignore */
      }
    }
    createdFiles.length = 0
  })

  describe('baseline', () => {
    it('creates .reference-ui/virtual with files matching include', () => {
      expect(existsSync(virtualDir)).toBe(true)
      expect(existsSync(virt('src', 'App.tsx'))).toBe(true)
      expect(existsSync(virt('src', 'main.tsx'))).toBe(true)

      const srcApp = readFileSync(join(srcDir, 'App.tsx'), 'utf-8')
      const virtualApp = readFileSync(virt('src', 'App.tsx'), 'utf-8')
      expect(virtualApp).toBe(srcApp)
    })

    it('excludes node_modules and .reference-ui from virtual copy', () => {
      expect(existsSync(join(virtualDir, 'node_modules'))).toBe(false)
      expect(existsSync(join(virtualDir, '.reference-ui', 'cache'))).toBe(false)
    })

    it('does not copy files outside include patterns', () => {
      expect(existsSync(join(virtualDir, 'tests'))).toBe(false)
    })
  })

  describe('watch reacts to new files in src (e2e)', () => {
    it('copies new .tsx file at src root', async () => {
      const file = join(srcDir, '__e2e_new__.tsx')
      createdFiles.push('src/__e2e_new__.tsx')
      await writeFile(file, 'export const New = () => null')

      const ok = await waitFor(() => existsSync(virt('src', '__e2e_new__.tsx')))
      expect(ok).toBe(true)
      expect(await readFile(virt('src', '__e2e_new__.tsx'), 'utf-8')).toBe(
        'export const New = () => null'
      )
    })

    it('copies new .ts file (include has ts and tsx)', async () => {
      const file = join(srcDir, '__e2e_helper__.ts')
      createdFiles.push('src/__e2e_helper__.ts')
      await writeFile(file, 'export const add = (a: number, b: number) => a + b')

      const ok = await waitFor(() => existsSync(virt('src', '__e2e_helper__.ts')))
      expect(ok).toBe(true)
      expect(await readFile(virt('src', '__e2e_helper__.ts'), 'utf-8')).toContain('add')
    })

    it('copies new file in nested dir (preserves structure)', async () => {
      const dir = join(srcDir, 'components')
      const file = join(dir, '__e2e_Button__.tsx')
      createdFiles.push('src/components')
      await mkdir(dir, { recursive: true })
      await writeFile(file, 'export const Button = () => <button />')

      const ok = await waitFor(() => existsSync(virt('src', 'components', '__e2e_Button__.tsx')))
      expect(ok).toBe(true)
      expect(await readFile(virt('src', 'components', '__e2e_Button__.tsx'), 'utf-8')).toBe(
        'export const Button = () => <button />'
      )
    })

    it('updates virtual when source file content changes', async () => {
      const file = join(srcDir, '__e2e_update__.tsx')
      createdFiles.push('src/__e2e_update__.tsx')
      await writeFile(file, 'export const X = () => <div>v1</div>')
      await waitFor(() => existsSync(virt('src', '__e2e_update__.tsx')))

      await writeFile(file, 'export const X = () => <div>v2</div>')
      const ok = await waitFor(
        () =>
          readFileSync(virt('src', '__e2e_update__.tsx'), 'utf-8') ===
          'export const X = () => <div>v2</div>'
      )
      expect(ok).toBe(true)
    })

    it('excludes files not matching include (e.g. .txt)', async () => {
      const file = join(srcDir, '__e2e_excluded__.txt')
      createdFiles.push('src/__e2e_excluded__.txt')
      await writeFile(file, 'not ts/tsx')

      await waitFor(() => existsSync(virt('src', 'App.tsx')))
      expect(existsSync(virt('src', '__e2e_excluded__.txt'))).toBe(false)
    })
  })

  /**
   * Virtual should mirror src: same files, no orphans, no missing.
   * watch:change → run:virtual:sync:file removes files from virtual on unlink.
   */
  describe('virtual mirrors src (no orphans or missing)', () => {
    const INCLUDE = ['src/**/*.ts', 'src/**/*.tsx'] as const
    const EXTENSION_TRANSFORMS: Record<string, string> = {
      '.mdx': '.jsx',
      '.js': '.js',
      '.jsx': '.jsx',
      '.ts': '.ts',
      '.tsx': '.tsx',
    }

    function* walkFiles(dir: string, base = dir): Generator<string> {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name)
        if (statSync(path).isDirectory()) {
          yield* walkFiles(path, base)
        } else {
          yield relative(base, path)
        }
      }
    }

    function getSourcePaths(): string[] {
      const out: string[] = []
      for (const rel of walkFiles(srcDir, srcDir)) {
        const ext = extname(rel)
        if (ext === '.ts' || ext === '.tsx') {
          out.push(join('src', rel))
        }
      }
      return out.sort()
    }

    function getVirtualPaths(): string[] {
      if (!existsSync(virtualDir)) return []
      const out: string[] = []
      for (const rel of walkFiles(virtualDir, virtualDir)) {
        out.push(rel)
      }
      return out.sort()
    }

    function virtualToPossibleSources(virtualRel: string): string[] {
      const ext = extname(virtualRel)
      const base = virtualRel.slice(0, -ext.length)
      if (ext === '.jsx') return [`${base}.jsx`, `${base}.mdx`]
      return [virtualRel]
    }

    it('virtual has no orphan files (every virtual file has a source counterpart)', async () => {
      const sourcePaths = () => new Set(getSourcePaths())
      const getOrphans = () => {
        const virtualPaths = getVirtualPaths()
        const src = sourcePaths()
        const list: string[] = []
        for (const vRel of virtualPaths) {
          const candidates = virtualToPossibleSources(vRel)
          if (!candidates.some((c) => src.has(c))) list.push(vRel)
        }
        return list
      }

      const ok = await waitFor(() => getOrphans().length === 0, { timeoutMs: 3000 })
      const orphans = getOrphans()
      expect(ok, `Orphan files in virtual (no source): ${orphans.join(', ')}`).toBe(true)
    })

    it('virtual has all source files (no missing)', () => {
      const sourcePaths = getSourcePaths()
      const missing: string[] = []

      for (const sRel of sourcePaths) {
        const ext = extname(sRel)
        const outExt = EXTENSION_TRANSFORMS[ext] ?? ext
        const virtualRel = sRel.slice(0, -ext.length) + outExt
        const abs = join(virtualDir, virtualRel)
        if (!existsSync(abs)) missing.push(sRel)
      }

      expect(missing, `Missing in virtual (source exists): ${missing.join(', ')}`).toEqual([])
    })
  })
})
