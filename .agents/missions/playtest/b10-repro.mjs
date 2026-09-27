// B-10 minimal repro: maxW="140r" never compiles while 120r/200r do —
// because the sheet only contains rules for static literals the extractor
// saw in lib sources (coverage model, not a stepped scale).
// Exit 0 = unexpected (140r compiled); exit 1 = bug reproduced.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const lib = resolve(here, '../../../packages/reference-lib')
const css = readFileSync(resolve(lib, '.reference-ui/styled/styles.css'), 'utf8')

const grep = (pattern) =>
  execFileSync('grep', ['-rn', '--include=*.ts', '--include=*.tsx', pattern, 'src', 'book'], {
    cwd: lib,
    encoding: 'utf8',
  }).trim()

const has120 = css.includes('max-w_120r')
const has200 = css.includes('max-w_200r')
const has140 = css.includes('max-w_140r')
console.log(`rule max-w_120r present: ${has120}`)
console.log(`rule max-w_200r present: ${has200}`)
console.log(`rule max-w_140r present: ${has140}`)

const lit120 = grep('120r').split('\n').filter((l) => l.includes('maxW')).slice(0, 3)
const lit200 = grep('200r').split('\n').filter((l) => /maxW|width|w=|max-w/i.test(l)).slice(0, 3)
let lit140 = ''
try {
  lit140 = grep('140r')
} catch {
  lit140 = ''
}
console.log(`maxW 120r literals in src/book: ${lit120.length} (e.g. ${lit120[0] ?? 'none'})`)
console.log(`200r width-ish literals in src/book: ${lit200.length}`)
console.log(`140r literals anywhere in src/book: ${lit140 === '' ? 0 : lit140.split('\n').length}`)

if (has120 && has200 && !has140 && lit140 === '') {
  console.log(
    'REPRODUCED: 120r/200r compile only because lib-internal literals exist; ' +
      'consumer-only 140r has no rule, paints nothing, and console-warns. ' +
      'No stepped scale is involved — the namer accepts any numeric; the sheet is coverage-gated.',
  )
  process.exit(1)
}
console.log('NOT reproduced: 140r compiled (compiler now emits continuous numerics?)')
process.exit(0)
