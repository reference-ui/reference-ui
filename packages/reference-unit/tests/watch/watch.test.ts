import { describe, it, expect, afterEach } from 'vitest'
import { writeFile, rm } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pkgRoot, virt, waitFor } from '../virtual/helpers'
import { waitForNextWatchReady } from './helpers'

/**
 * Watch / dev server: ref sync --watch runs in background (global-setup).
 * We create/update a file with a Div and a bg color, then assert the virtual copy updates.
 */

const WATCH_E2E_FILE = 'src/__e2e_watch__.tsx'
const COLOR_A = 'rgb(11, 22, 33)'
const COLOR_B = 'rgb(99, 88, 77)'
const WATCH_CSS_FILE = 'src/__e2e_watch_css__.tsx'
const HEX_A = '#123456'
const HEX_B = '#abcdef'
const WATCH_TOKENS_FILE = 'src/__e2e_watch_tokens__.ts'
const TOKEN_HEX_A = '#aabb11'
const TOKEN_HEX_B = '#cc22dd'
const STYLES_PATH = join(pkgRoot, '.reference-ui', 'styled', 'styles.css')
const PANDA_CONFIG_PATH = join(pkgRoot, '.reference-ui', 'panda.config.ts')

function makeContent(bg: string) {
  return `import { Div } from '@reference-ui/react'
export function WatchE2E() {
  return <Div data-testid="watch-div" backgroundColor="${bg}">watch me</Div>
}
`
}

function makeCssContent(color: string) {
  return `import { css } from '@reference-ui/react'
export function WatchCssE2E() {
  return <div className={css({ color: '${color}' })}>watch css</div>
}
`
}

function makeTokensContent(color: string) {
  // Split the import specifier so the fragment scanner does not false-positive
  // match this helper file itself (scanners check raw file content for import patterns).
  const from = '@reference-ui' + '/system'
  return `import { tokens } from '${from}'\ntokens({ colors: { 'e2e-watch-token': { value: '${color}' } } })\n`
}

describe('watch – dev server reactivity', () => {
  afterEach(async () => {
    try {
      await rm(join(pkgRoot, WATCH_E2E_FILE), { force: true })
    } catch {
      /* ignore */
    }
    try {
      await rm(join(pkgRoot, WATCH_CSS_FILE), { force: true })
    } catch {
      /* ignore */
    }
    try {
      await rm(join(pkgRoot, WATCH_TOKENS_FILE), { force: true })
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

  it('watch mode rebuilds styled output after a watched css() edit', async () => {
    const srcPath = join(pkgRoot, WATCH_CSS_FILE)
    await writeFile(srcPath, makeCssContent(HEX_A))

    const firstReady = await waitForNextWatchReady(20_000)
    expect(firstReady, 'watch mode should emit a fresh ready signal after the first css() file write').toBe(
      true
    )

    const initialCss = await waitFor(
      () => existsSync(STYLES_PATH) && readFileSync(STYLES_PATH, 'utf-8').includes(HEX_A),
      { timeoutMs: 20_000 }
    )
    expect(initialCss, 'styled/styles.css should include the first watched css() color').toBe(true)

    await writeFile(srcPath, makeCssContent(HEX_B))

    const secondReady = await waitForNextWatchReady(20_000)
    expect(secondReady, 'watch mode should emit a fresh ready signal after updating the css() file').toBe(
      true
    )

    const updatedCss = await waitFor(
      () => existsSync(STYLES_PATH) && readFileSync(STYLES_PATH, 'utf-8').includes(HEX_B),
      { timeoutMs: 20_000 }
    )
    expect(updatedCss, 'styled/styles.css should update after the watched css() edit').toBe(true)
  }, 30_000)

  it('watch mode rebuilds panda config after a token fragment file update', async () => {
    const srcPath = join(pkgRoot, WATCH_TOKENS_FILE)
    await writeFile(srcPath, makeTokensContent(TOKEN_HEX_A))

    const firstReady = await waitForNextWatchReady(20_000)
    expect(firstReady, 'watch mode should emit a fresh ready signal after writing a token fragment file').toBe(
      true
    )

    const initialConfig = await waitFor(
      () => existsSync(PANDA_CONFIG_PATH) && readFileSync(PANDA_CONFIG_PATH, 'utf-8').includes(TOKEN_HEX_A),
      { timeoutMs: 20_000 }
    )
    expect(initialConfig, 'panda.config.ts should include the first watched token color').toBe(true)

    await writeFile(srcPath, makeTokensContent(TOKEN_HEX_B))

    const secondReady = await waitForNextWatchReady(20_000)
    expect(secondReady, 'watch mode should emit a fresh ready signal after updating the token file').toBe(
      true
    )

    const updatedConfig = await waitFor(
      () => existsSync(PANDA_CONFIG_PATH) && readFileSync(PANDA_CONFIG_PATH, 'utf-8').includes(TOKEN_HEX_B),
      { timeoutMs: 20_000 }
    )
    expect(updatedConfig, 'panda.config.ts should update after the token fragment edit').toBe(true)
  }, 60_000)
})
