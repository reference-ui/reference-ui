import { describe, it, expect, afterEach } from 'vitest'
import { writeFile, readFile, rm, mkdir } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
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
})
