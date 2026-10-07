// Byte-identity pin capture for the voyage-one-shot mission (wave 0).
// It takes a package directory, hashes every file under its `.reference-ui/`
// sync output (excluding the transient `tmp/` scratch dir), and emits sorted
// sha256 lines plus an aggregate tree hash. Deterministic: paths are relative
// and forward-slashed, so the pin is comparable across runs and machines.
//
// Usage: node capture-pins.mjs <pkgDir> [label]
//   e.g. node capture-pins.mjs packages/reference-docs docs
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const ROOT = new URL('../../../../', import.meta.url).pathname.replace(/\/$/, '')
const dir = join(ROOT, process.argv[2] ?? '')
const label = process.argv[3] ?? process.argv[2]
const root = join(dir, '.reference-ui')

function walk(current, acc = []) {
  for (const entry of readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = join(current, entry.name)
    const rel = relative(root, full).split(sep).join('/')
    if (rel === 'tmp' || rel.startsWith('tmp/')) continue
    if (entry.isDirectory()) walk(full, acc)
    else if (entry.isFile()) acc.push(full)
  }
  return acc
}

const files = walk(root).sort()
const lines = []
const tree = createHash('sha256')
for (const full of files) {
  const bytes = readFileSync(full)
  const digest = createHash('sha256').update(bytes).digest('hex')
  const rel = relative(root, full).split(sep).join('/')
  lines.push(`${digest}  ${label}/.reference-ui/${rel}`)
  tree.update(`${digest}  ${rel}\n`)
}

console.log(`# ${label} — ${files.length} files under ${relative(ROOT, root)}`)
console.log(lines.join('\n'))
console.log(`# ${label} aggregate: ${tree.digest('hex')}  files=${files.length}`)
