// Coded-throw regression pins: the sync error surface must name failure classes.
// They take a real bad-token world through the real compiler plus a legacy
// codeless entry, and assert the throw carries every minted code in its
// `CODE: message` segment while codeless entries degrade without one.
// Censuses count the throw by `rg -c`, never by prose.
import { describe, expect, it } from 'vitest'
import { throwOnErrorDiagnostics } from '../report.ts'
import {
  TOKENS_FILE,
  compileWorld,
  configFile,
  styleFile,
  useReproCleanup,
  writeProject,
} from './repro-world.ts'

useReproCleanup()

function thrownMessage(run: () => void): string {
  try {
    run()
  } catch (error) {
    return String(error)
  }
  return ''
}

describe('throwOnErrorDiagnostics', () => {
  it('names every minted error code in the throw', async () => {
    const dir = await writeProject({
      'ui.config.ts': configFile(''),
      'theme/tokens.ts': TOKENS_FILE,
      'theme/bad.ts': styleFile("export const cls = css({ color: '{colors.nope}' })"),
    })
    const result = await compileWorld(dir)
    const errors = result.diagnostics.filter(entry => entry.severity === 'error')
    expect(errors.length).toBeGreaterThan(0)
    for (const entry of errors) expect(entry.code).toBeDefined()
    const thrown = thrownMessage(() => throwOnErrorDiagnostics(result.diagnostics))
    expect(thrown).not.toBe('')
    const missing = errors
      .map(entry => entry.code)
      .filter(code => code === undefined || !thrown.includes(`${code}: `))
    expect(missing).toEqual([])
  })

  it('degrades without a code segment for legacy codeless errors', () => {
    const thrown = thrownMessage(() =>
      throwOnErrorDiagnostics([{ severity: 'error', message: 'legacy boom' }])
    )
    expect(thrown).toContain('legacy boom')
    expect(thrown).not.toContain('undefined')
  })
})
