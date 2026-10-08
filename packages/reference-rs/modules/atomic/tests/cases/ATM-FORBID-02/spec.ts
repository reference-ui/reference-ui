/**
 * No-eval tripwire. Function-call leaves diagnose and are dropped. Static
 * siblings still extract. The atomic crate does not depend on a JS VM.
 * (S6 E8-class re-point: the call refusal rides the opt-in compiler
 * channel; the default channel is silent.)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect } from 'vitest'
import { compileCase, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-FORBID-02',
  async verify(result) {
    expect(hasWant(result, 'mt', '2r')).toBe(true)
    expect(hasWant(result, 'color', 'red')).toBe(false)

    // The refusal proves no exact runtime miss, so the default is silent.
    expect(result.diagnostics ?? []).toHaveLength(0)

    // Opt-in: the refused call still diagnoses on the compiler channel.
    const opted = await compileCase('ATM-FORBID-02', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const channel = opted.compilerDiagnostics ?? []
    const refused = channel.filter(d => d.code === 'ATM-W-DYNAMIC-EXPRESSION')
    expect(refused.length).toBeGreaterThanOrEqual(1)

    const cargo = fs.readFileSync(
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../Cargo.toml'),
      'utf8'
    )
    expect(cargo.toLowerCase()).not.toMatch(/quickjs|boa|v8|deno_core/)
  },
}

export default spec
