import { describe, it, expect, afterEach } from 'vitest'
import { writeFile, readFile, rm } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pkgRoot, srcDir, virt, waitFor } from './helpers'

/**
 * Watch reactivity: ref sync --watch runs in background (global-setup).
 * We create/update a file with a Div and a bg color, then assert the virtual copy updates.
 */

const WATCH_E2E_FILE = 'src/__e2e_watch__.tsx'
const COLOR_A = 'rgb(11, 22, 33)'
const COLOR_B = 'rgb(99, 88, 77)'

function makeContent(bg: string) {
  return `import { Div } from '@reference-ui/react'
export function WatchE2E() {
  return <Div data-testid="watch-div" backgroundColor="${bg}">watch me</Div>
}
`
}

describe('virtual – watch and recompile', () => {
  afterEach(async () => {
    try {
      await rm(join(pkgRoot, WATCH_E2E_FILE), { force: true })
    } catch {
      /* ignore */
    }
  })

  it('virtual copy updates when source file content changes (Div bg color)', async () => {
    const srcPath = join(pkgRoot, WATCH_E2E_FILE)
    await writeFile(srcPath, makeContent(COLOR_A))

    const ok = await waitFor(() => {
      if (!existsSync(virt('src', '__e2e_watch__.tsx'))) return false
      const content = readFileSync(virt('src', '__e2e_watch__.tsx'), 'utf-8')
      return content.includes(COLOR_A)
    })
    expect(ok, 'virtual copy should contain initial color').toBe(true)

    await writeFile(srcPath, makeContent(COLOR_B))

    const updated = await waitFor(
      () => readFileSync(virt('src', '__e2e_watch__.tsx'), 'utf-8').includes(COLOR_B),
      { timeoutMs: 6000 }
    )
    expect(updated, 'virtual copy should update to new bg color after edit').toBe(true)
  })
})
