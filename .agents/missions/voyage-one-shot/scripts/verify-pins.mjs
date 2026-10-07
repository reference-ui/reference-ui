// Byte-identity pin verifier for voyage-one-shot.
// It re-hashes the three pinned sync outputs and compares them, line for line,
// against pins/baseline.sha256 (hash lines only; comments ignored). Exit 0 and
// prints PASS when every file matches; exit 1 and prints the diff otherwise.
//
// Usage: node verify-pins.mjs
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('../../../../', import.meta.url).pathname.replace(/\/$/, '')
const cap = join(ROOT, '.agents/missions/voyage-one-shot/scripts/capture-pins.mjs')
const pinsPath = join(ROOT, '.agents/missions/voyage-one-shot/pins/baseline.sha256')
const targets = [
  ['packages/reference-docs', 'docs'],
  ['packages/reference-lib', 'lib'],
  ['packages/reference-icons', 'icons'],
]

const actual = []
for (const [pkg, label] of targets) {
  const out = execFileSync(process.execPath, [cap, pkg, label], { encoding: 'utf8' })
  for (const line of out.split('\n')) if (/^[0-9a-f]{64} {2}/.test(line)) actual.push(line)
}

const expected = readFileSync(pinsPath, 'utf8').split('\n').filter((line) => /^[0-9a-f]{64} {2}/.test(line))

const actualSet = new Set(actual)
const expectedSet = new Set(expected)
const missing = expected.filter((line) => !actualSet.has(line))
const extra = actual.filter((line) => !expectedSet.has(line))

if (missing.length === 0 && extra.length === 0) {
  console.log(`PASS — ${expected.length} pinned files byte-identical (docs+lib+icons)`)
  process.exit(0)
}
console.error(`FAIL — ${missing.length} missing/changed, ${extra.length} unexpected`)
for (const line of missing.slice(0, 40)) console.error(`  expected: ${line}`)
for (const line of extra.slice(0, 40)) console.error(`  actual:   ${line}`)
process.exit(1)
