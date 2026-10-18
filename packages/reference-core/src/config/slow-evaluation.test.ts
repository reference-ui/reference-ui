// Unit tests for the slow-config warning.
// They take measured evaluation timings with the config's external imports and assert that only a run past
// the threshold warns, that the lib barrel is named with the baseSystem subpath as the fix, that other
// externals are listed, and that the standalone line prints only outside verbose and --json runs.

import { afterEach, describe, expect, it, vi } from 'vitest'
import { SLOW_CONFIG_CODE } from '../diagnostics/codes.ts'
import { CONFIG_SLOW_EVALUATION_MS, printConfigWarnings, slowConfigDiagnostic } from './slow-evaluation.ts'

const CONFIG = '/project/ui.config.ts'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('slowConfigDiagnostic', () => {
  it('stays silent at or under the threshold', () => {
    const timing = { configPath: CONFIG, durationMs: CONFIG_SLOW_EVALUATION_MS, externalImports: ['@reference-ui/lib'] }
    expect(slowConfigDiagnostic(timing)).toBeUndefined()
  })

  it('names the lib barrel and points at the baseSystem subpath', () => {
    const diagnostic = slowConfigDiagnostic({
      configPath: CONFIG,
      durationMs: 1512.4,
      externalImports: ['@reference-ui/lib', 'zod'],
    })
    expect(diagnostic).toMatchObject({ severity: 'warning', code: SLOW_CONFIG_CODE, file: CONFIG })
    expect(diagnostic?.message).toContain('1512 ms')
    expect(diagnostic?.message).toContain("'@reference-ui/lib' barrel")
    expect(diagnostic?.help?.join('\n')).toContain("'@reference-ui/lib/baseSystem'")
  })

  it('lists the externals when the barrel is not one of them', () => {
    const diagnostic = slowConfigDiagnostic({ configPath: CONFIG, durationMs: 2000, externalImports: ['zod', 'lodash'] })
    expect(diagnostic?.message).toContain("'zod', 'lodash'")
    expect(diagnostic?.message).not.toContain('barrel')
  })

  it('blames the config code itself when it imports no package', () => {
    const diagnostic = slowConfigDiagnostic({ configPath: CONFIG, durationMs: 2000, externalImports: [] })
    expect(diagnostic?.message).toContain('config code itself is slow')
    expect(diagnostic?.help).toBeUndefined()
  })
})

describe('printConfigWarnings', () => {
  const slow = slowConfigDiagnostic({ configPath: CONFIG, durationMs: 1500, externalImports: ['@reference-ui/lib'] })
  const entries = slow === undefined ? [] : [slow]

  it('prints one line by default', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    printConfigWarnings(entries)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0]?.[0])).toContain(SLOW_CONFIG_CODE)
  })

  it('leaves the line to the verbose list and the --json payload', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    printConfigWarnings(entries, { verbose: true })
    printConfigWarnings(entries, { json: true })
    printConfigWarnings([])
    expect(warn).not.toHaveBeenCalled()
  })
})
