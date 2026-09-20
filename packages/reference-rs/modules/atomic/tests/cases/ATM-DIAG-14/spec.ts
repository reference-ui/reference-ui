/**
 * Source-modes station (ATM-DIAG-14, Error Correct Slice 2 + 5 channel).
 * .ts/.tsx/.js/.jsx use the one compiler parse; JSX mode, parse errors,
 * and UTF-16 locations do not drift between extraction and diagnostics.
 * The opt-in `compilerDiagnostics` channel (`logs: ['compiler']`) records
 * per-mode expected-key facts; the themeColor position pin reads that
 * channel (R2 re-point — dynamic refusals ride opt-in, not default).
 */
import { expect } from 'vitest'
import { compileCase, hasWant, type AtomicCaseSpec } from '../../helpers.js'

interface ChannelDiagnostic {
  severity: string
  code: string
  message: string
  file?: string
  line?: number
  column?: number
}

const MODE_VALUES: Array<[file: string, color: string]> = [
  ['mt.ts', 'red'],
  ['mt.tsx', 'blue'],
  ['mt.js', 'green'],
  ['mt.jsx', 'purple'],
]

const spec: AtomicCaseSpec = {
  id: 'ATM-DIAG-14',
  async verify(result) {
    // Every mode extracts: each file's distinct color reaches wants/plans.
    for (const [, color] of MODE_VALUES) {
      expect(hasWant(result, 'color', color)).toBe(true)
      expect(
        result.stylePlans.some(p => p.prop === 'color' && p.value === color)
      ).toBe(true)
    }

    // Opt-in first: the compiler channel records per-mode expectations.
    const optIn = await compileCase('ATM-DIAG-14', {
      logs: ['compiler'],
    } as unknown as Parameters<typeof compileCase>[1])
    const channel = (optIn as unknown as { compilerDiagnostics?: ChannelDiagnostic[] })
      .compilerDiagnostics
    expect(channel, 'opt-in compiler channel records per-mode expectations').toBeDefined()

    // UTF-16 extract position past the emoji (byte-based would read 56).
    const warnings = (channel ?? []).filter(d => d.severity === 'warning')
    const theme = warnings.find(
      d => d.message.includes("'themeColor'") && (d.file ?? '').endsWith('unicode.ts')
    )
    expect(theme, 'dynamic identifier past the emoji is located').toBeDefined()
    expect(theme!.line).toBe(3)
    expect(theme!.column).toBe(54)

    // Parse errors are located on the shared parse (no second coordinate
    // system), and the broken file does not stop the other modes.
    const errors = (result.diagnostics ?? []).filter(d => d.severity === 'error')
    const parseError = errors.find(
      d => d.code === 'ATM-E-PARSE' && (d.file ?? '').endsWith('broken.jsx')
    )
    expect(parseError, 'broken.jsx yields a located ATM-E-PARSE').toBeDefined()
    expect(parseError!.line).toBeGreaterThan(0)
    expect(parseError!.column).toBeGreaterThan(0)

    // Per-mode expectation agreement on the opt-in channel.
    for (const [file] of MODE_VALUES) {
      const facts = channel!.filter(d => (d.file ?? '').endsWith(file))
      expect(facts.length, `expected-key facts for ${file}`).toBeGreaterThan(0)
      for (const fact of facts) {
        expect(fact.line).toBeGreaterThan(0)
        expect(fact.column).toBeGreaterThan(0)
      }
    }
  },
}

export default spec
