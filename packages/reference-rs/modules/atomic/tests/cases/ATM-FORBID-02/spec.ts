/**
 * No-eval tripwire. Function-call leaves diagnose and are dropped. Static
 * siblings still extract. The atomic crate does not depend on a JS VM.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-FORBID-02',
  verify(result) {
    expect(hasWant(result, 'mt', '2r')).toBe(true)
    expect(hasWant(result, 'color', 'red')).toBe(false)
    expect(result.diagnostics.length).toBeGreaterThanOrEqual(1)
    const cargo = fs.readFileSync(
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../Cargo.toml'),
      'utf8'
    )
    expect(cargo.toLowerCase()).not.toMatch(/quickjs|boa|v8|deno_core/)
  },
}

export default spec
