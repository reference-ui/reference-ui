import { describe, it, expect, afterEach } from 'vitest'
import { writeFile, rm } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pkgRoot, srcDir, virt, waitFor } from './helpers'

/**
 * E2E: create files with css/recipe imports and MDX, verify virtual transforms them.
 * ref sync --watch runs in background (global-setup).
 * Sequential: avoid parallel races with watch + shared virtual dir.
 */
describe.sequential('virtual – transforms (e2e)', () => {
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

  it('rewrites css and cva imports to styled-system path', async () => {
    const file = join(srcDir, '__e2e_styles__.tsx')
    createdFiles.push('src/__e2e_styles__.tsx')
    const content = `import { css, cva } from '@reference-ui/react'
const button = cva({ base: 'px-4 py-2' })
export const styles = css({ color: 'red' })
export const Button = () => <button className={button()}>Click</button>
`
    await writeFile(file, content)
    // Touch file to trigger update event; watcher may emit create before write completes.
    await new Promise((r) => setTimeout(r, 100))
    await writeFile(file, content)

    const ok = await waitFor(
      () => {
        if (!existsSync(virt('src', '__e2e_styles__.tsx'))) return false
        const c = readFileSync(virt('src', '__e2e_styles__.tsx'), 'utf-8')
        return c.includes('src/system/css') && c.includes('cva(') && c.includes('css(')
      },
      { timeoutMs: 4000 }
    )
    expect(ok).toBe(true)
    const virtualContent = readFileSync(virt('src', '__e2e_styles__.tsx'), 'utf-8')
    expect(virtualContent).toContain('src/system/css')
    expect(virtualContent).toContain('cva(')
    expect(virtualContent).toContain('css(')
  })

  it('transforms MDX to JSX (.mdx → .jsx in virtual)', async () => {
    const file = join(srcDir, '__e2e_page__.mdx')
    createdFiles.push('src/__e2e_page__.mdx')
    await writeFile(
      file,
      `# Hello from MDX
export const Meta = () => null
`
    )

    const ok = await waitFor(() => existsSync(virt('src', '__e2e_page__.jsx')))
    expect(ok).toBe(true)

    const virtualContent = readFileSync(virt('src', '__e2e_page__.jsx'), 'utf-8')
    expect(virtualContent).toContain('Hello from MDX')
    expect(virtualContent).toContain('Meta')
    expect(virtualContent).toMatch(/function|=>|<_components|MDXContent/)
  })
})
