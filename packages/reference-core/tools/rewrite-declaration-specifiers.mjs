// Declaration post-pass for the shipped neo package, run after the tsc emit and the twin layout.
// tsc keeps the `.ts` names the source wrote in every emitted .d.ts, so a consumer reads
// `from './config/types.ts'`. TypeScript still finds the .d.ts beside it, but tasty maps only
// .js/.mjs/.cjs to a declaration and reports each `.ts` import as TST-W-UNRESOLVED-IMPORT.
// The rewrite repoints each relative specifier at its emitted name. The guards fail the build when
// a shipped declaration imports a file that does not ship, or when an export that TypeScript would
// read from a `.ts` twin has no `types` condition. Comments are masked first, so prose never counts.

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, posix, relative, resolve } from 'node:path'

const DECLARATION_FILE = /\.d\.(ts|mts|cts)$/
const DECLARATION_SUFFIXES = ['.d.ts', '.d.mts', '.d.cts']
const SOURCE_SUFFIXES = ['.ts', '.tsx', '.mts', '.cts']

// Source extension to the emitted names tried in order. tsc emits .tsx as .js under react-jsx.
const EMITTED_FOR_SOURCE = new Map([
  ['.ts', ['.js']],
  ['.tsx', ['.js', '.jsx']],
  ['.mts', ['.mjs']],
  ['.cts', ['.cjs']],
])

// The declaration companion that TypeScript and tasty pair with each emitted extension.
const COMPANION_FOR_EMITTED = new Map([
  ['.js', '.d.ts'],
  ['.jsx', '.d.ts'],
  ['.mjs', '.d.mts'],
  ['.cjs', '.d.cts'],
])

// Specifier positions in declaration text: from-clauses, import(), bare import, require(), and
// triple-slash path/types references. The backreference keeps the opening and closing quote equal.
const SPECIFIER_PATTERN =
  /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*|<reference\s+(?:types|path)\s*=\s*)(['"])([^'"\n]+)\2/g

// Comments and string literals, matched left to right so a `//` inside a string never opens a comment.
// A `///` directive is excluded from the comment alternative: its <reference> path is real code.
const COMMENT_OR_STRING =
  /(?<!\/)\/\/(?!\/)[^\n]*|\/\*[\s\S]*?(?:\*\/|$)|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`/g

const isRelative = (specifier) => specifier.startsWith('./') || specifier.startsWith('../')
const isDeclarationSpecifier = (specifier) => DECLARATION_SUFFIXES.some((suffix) => specifier.endsWith(suffix))
const isFile = (path) => existsSync(path) && statSync(path).isFile()
const isComment = (token) => token.startsWith('//') || token.startsWith('/*')

function listDeclarationFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return listDeclarationFiles(full)
    return DECLARATION_FILE.test(entry.name) ? [full] : []
  })
}

// Blanks each comment to spaces and keeps newlines, so match offsets in the result equal those in the source.
function maskComments(text) {
  return text.replace(COMMENT_OR_STRING, (token) => (isComment(token) ? token.replace(/[^\n]/g, ' ') : token))
}

// Each specifier of an import-like position in a declaration, with comments excluded.
function specifiersIn(text) {
  return [...maskComments(text).matchAll(SPECIFIER_PATTERN)].map((match) => match[3])
}

// True when `base` has both an emitted file and its declaration companion, which is what resolves a `.js` specifier.
function isEmittedPair(base, emittedExt) {
  return isFile(`${base}${emittedExt}`) && isFile(`${base}${COMPANION_FOR_EMITTED.get(emittedExt)}`)
}

// The emitted-name specifier for a source-extension specifier, or null when no emitted pair sits beside it.
function emittedSpecifier(specifier, fromFile) {
  if (isDeclarationSpecifier(specifier)) return null
  const ext = posix.extname(specifier)
  const candidates = EMITTED_FOR_SOURCE.get(ext)
  if (candidates === undefined) return null
  const stem = specifier.slice(0, -ext.length)
  const base = resolve(dirname(fromFile), stem)
  const emittedExt = candidates.find((candidate) => isEmittedPair(base, candidate))
  return emittedExt === undefined ? null : `${stem}${emittedExt}`
}

// Why a relative specifier does not name a shipped file, or null when it does.
function unshippedReason(specifier, fromFile) {
  if (SOURCE_SUFFIXES.some((suffix) => specifier.endsWith(suffix))) {
    return 'keeps a TypeScript extension, which tasty cannot map to its declaration'
  }
  const base = resolve(dirname(fromFile), specifier)
  const ext = posix.extname(specifier)
  if (COMPANION_FOR_EMITTED.has(ext)) {
    return isEmittedPair(base.slice(0, -ext.length), ext) ? null : 'has no shipped emitted file and declaration pair'
  }
  if (ext === '.json') return isFile(base) ? null : 'names no shipped file'
  const candidates = [base, `${base}.d.ts`, `${base}.js`, join(base, 'index.d.ts'), join(base, 'index.js')]
  return candidates.some(isFile) ? null : 'names no shipped file'
}

// Rewrites the relative specifiers of one declaration text that have an emitted pair. Returns the new text and the count.
function repointSpecifiers(text, fromFile) {
  const masked = maskComments(text)
  let out = ''
  let last = 0
  let count = 0
  for (const match of masked.matchAll(SPECIFIER_PATTERN)) {
    const [whole, keyword, quote, specifier] = match
    const emitted = isRelative(specifier) ? emittedSpecifier(specifier, fromFile) : null
    if (emitted === null) continue
    out += text.slice(last, match.index) + keyword + quote + emitted + quote
    last = match.index + whole.length
    count += 1
  }
  return { text: out + text.slice(last), count }
}

export function rewriteDeclarationSpecifiers({ pkgDir }) {
  const files = listDeclarationFiles(join(pkgDir, 'dist'))
  let rewritten = 0
  let filesChanged = 0
  for (const file of files) {
    const next = repointSpecifiers(readFileSync(file, 'utf8'), file)
    if (next.count === 0) continue
    writeFileSync(file, next.text)
    rewritten += next.count
    filesChanged += 1
  }
  return { files: files.length, filesChanged, rewritten }
}

// Every relative specifier in a shipped declaration that names no shipped file, as printable problems.
export function declarationSpecifierProblems({ pkgDir }) {
  return listDeclarationFiles(join(pkgDir, 'dist')).flatMap((file) =>
    specifiersIn(readFileSync(file, 'utf8'))
      .filter(isRelative)
      .flatMap((specifier) => {
        const reason = unshippedReason(specifier, file)
        return reason === null ? [] : [`${relative(pkgDir, file)}: "${specifier}" ${reason}`]
      }),
  )
}

// Whether an export entry names a types condition that resolves to a shipped file.
const hasShippedTypes = (entry, pkgDir) => typeof entry.types === 'string' && isFile(join(pkgDir, entry.types))

// Null when an export needs no types condition, or already names a shipped one; otherwise why it needs one.
function untypedExportProblem(entry, pkgDir) {
  const runtime = typeof entry === 'string' ? entry : (entry.import ?? entry.default)
  if (typeof runtime !== 'string' || !runtime.endsWith('.js')) return null
  const stem = join(pkgDir, runtime.slice(0, -'.js'.length))
  const twin = ['.ts', '.tsx'].map((ext) => `${stem}${ext}`).find(isFile)
  if (twin === undefined || (typeof entry !== 'string' && hasShippedTypes(entry, pkgDir))) return null
  return `runs ${runtime} for TypeScript, but ${relative(pkgDir, twin)} shadows its declaration; add a "types" condition that names a shipped .d.ts`
}

// Every export whose runtime target has a `.ts`/`.tsx` twin beside it but no `types` condition naming a shipped
// declaration. TypeScript reads the twin in that case, and the twin is transpiled JS with its type-only exports erased.
export function exportTypeProblems({ pkgDir }) {
  const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'))
  return Object.entries(pkg.exports ?? {}).flatMap(([subpath, entry]) => {
    const problem = untypedExportProblem(entry, pkgDir)
    return problem === null ? [] : [`exports["${subpath}"] ${problem}`]
  })
}
