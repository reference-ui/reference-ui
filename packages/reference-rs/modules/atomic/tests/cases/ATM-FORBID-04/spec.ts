/**
 * No-css.js tripwire. CompileResult is data. The input tree is not polluted
 * with generated JavaScript, and the result has no js artifact field.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-FORBID-04',
  verify(result) {
    expect(result.stylesheet).toBeTruthy()
    expect(result.css?.classes).toBeTruthy()
    expect(result).not.toHaveProperty('js')
    expect(result).not.toHaveProperty('cssJs')
    const inputDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'input')
    const generated = walkJs(inputDir)
    expect(generated.filter(f => f.endsWith('css.js') || f.endsWith('css.mjs'))).toEqual(
      []
    )
  },
}

function walkJs(dir: string): string[] {
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...walkJs(full))
    } else if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) {
      out.push(full)
    }
  }
  return out
}

export default spec
