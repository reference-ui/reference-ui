/**
 * Private-table tripwire. border.rs / dimensional.rs / tokens/mod.rs must
 * not grow BORDER_CONFIGS, tuple slices, or hardcoded accentColor. A compile
 * of border shorthand still asks canon longhands.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../src')

const spec: AtomicCaseSpec = {
  id: 'ATM-FORBID-05',
  verify(result) {
    const border = read('resolve/shorthands/border.rs')
    const dimensional = read('resolve/shorthands/dimensional.rs')
    const tokens = read('resolve/tokens/mod.rs')
    expect(border).not.toContain('BORDER_CONFIGS')
    expect(border).not.toContain('BorderProps')
    expect(dimensional).not.toContain('DIMENSIONAL_CONFIGS')
    expect(dimensional).not.toContain('DimensionalProps')
    expect(border).not.toContain('&[(&str')
    expect(dimensional).not.toContain('&[(&str')
    expect(tokens).not.toContain('"accentColor"')
    expect(tokens).not.toContain('matches!(prop,')
    expect(result.stylesheet).toContain('border-bottom-width: 3px;')
    expect(result.stylesheet).toContain('border-bottom-style: solid;')
    expect(result.stylesheet.toLowerCase()).not.toContain('currentcolor')
  },
}

function read(rel: string): string {
  return fs.readFileSync(path.join(SRC, rel), 'utf8')
}

export default spec
