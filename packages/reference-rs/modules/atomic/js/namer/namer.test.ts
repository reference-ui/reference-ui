/**
 * Runtime namer pins: the browser-safe leaf import graph plus the rules
 * version the goldens carry. The leaf test fails if any namer source gains a
 * runtime import outside its sibling directory — no `runtime/js`, no
 * `atomic/js/index`, no `node:` builtins — so the `./namer` subpath stays
 * bundlable for the browser. The version test fails if the committed namer
 * goldens and `NAMER_RULES_VERSION` disagree.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { collapseRNumber, renderDecimal } from './lexical.js'
import { NAMER_RULES_VERSION } from './index.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const GOLDEN_DIR = path.resolve(HERE, '..', '..', 'tests', 'namer-goldens')

/** Static and side-effect runtime imports; `import type` lines are erased. */
const STATIC_IMPORT = /^\s*import\s+(?!type\b)(?:[^'"]*from\s*)?['"]([^'"]+)['"]/gm
/** Dynamic imports and requires with a literal specifier. */
const DYNAMIC_IMPORT = /(?:import|require)\(\s*['"]([^'"]+)['"]\s*\)/g

function namerSources(): string[] {
  return fs
    .readdirSync(HERE)
    .filter(name => name.endsWith('.ts') && !name.endsWith('.test.ts'))
    .map(name => path.join(HERE, name))
}

function runtimeSpecifiers(file: string): string[] {
  const text = fs.readFileSync(file, 'utf8')
  const found: string[] = []
  for (const pattern of [STATIC_IMPORT, DYNAMIC_IMPORT]) {
    pattern.lastIndex = 0
    let match = pattern.exec(text)
    while (match !== null) {
      found.push(match[1] as string)
      match = pattern.exec(text)
    }
  }
  return found
}

describe('namer leaf import graph', () => {
  it('imports siblings at runtime and nothing else', () => {
    const files = namerSources()
    expect(files.length).toBeGreaterThan(0)
    for (const file of files) {
      for (const spec of runtimeSpecifiers(file)) {
        expect(spec.startsWith('.'), `${path.basename(file)} runtime-imports ${spec}`).toBe(true)
        const target = path.resolve(path.dirname(file), spec)
        expect(
          target.startsWith(HERE + path.sep),
          `${path.basename(file)} runtime-imports outside the namer: ${spec}`
        ).toBe(true)
      }
      const text = fs.readFileSync(file, 'utf8')
      expect(text.includes('node:'), `${path.basename(file)} names a node: builtin`).toBe(false)
    }
  })
})

describe('namer rules version', () => {
  it('equals every committed golden rulesVersion', () => {
    expect(Number.isInteger(NAMER_RULES_VERSION)).toBe(true)
    expect(NAMER_RULES_VERSION).toBeGreaterThan(0)
    const files = fs.readdirSync(GOLDEN_DIR).filter(name => name.endsWith('.json'))
    expect(files.length).toBeGreaterThan(0)
    for (const name of files) {
      const golden = JSON.parse(fs.readFileSync(path.join(GOLDEN_DIR, name), 'utf8')) as {
        rulesVersion: unknown
      }
      expect(golden.rulesVersion, name).toBe(NAMER_RULES_VERSION)
    }
  })
})

describe('lexical totality past the fence', () => {
  it('renders out-of-fence magnitudes the way Rust Display does (never exponent)', () => {
    expect(renderDecimal(1e21)).toBe('1000000000000000000000')
    expect(renderDecimal(1e-7)).toBe('0.0000001')
    expect(renderDecimal(-1.5e-7)).toBe('-0.00000015')
  })

  it('collapses $r multipliers with the 1e-6 epsilon and saturating i64 clamps', () => {
    expect(collapseRNumber(2.0000005)).toBe('2')
    expect(collapseRNumber(2.5)).toBe('2.5')
    expect(collapseRNumber(1e19)).toBe('9223372036854775807')
    expect(collapseRNumber(-1e19)).toBe('-9223372036854775808')
    expect(collapseRNumber(1e21)).toBeUndefined()
    expect(collapseRNumber(Number.NaN)).toBeUndefined()
  })
})
