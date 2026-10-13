// Repoints the specifiers in lib's emitted declarations at files that ship in
// the tarball. tsc keeps the names the source wrote: `@reference-ui/react`,
// `@reference-ui/styled`, `@reference-ui/types`, and relative `.reference-ui/`
// paths. None of those resolve for a consumer (only dist/ and the baseSystem
// payload are in `files`), so skipLibCheck: false fails on every component.
// Each one moves to the copy materialize-runtime writes under
// dist/runtime/reference-ui/. A guarded specifier with no shipped target fails
// the build instead of shipping a declaration that cannot resolve.
//
// A name ships when both readers find a file for it. TypeScript reads `.mjs` as
// `.d.mts` and `.js` as `.d.ts`; tasty reads a `.js` or `.mjs` name as a `.d.ts`
// beside it, or as the file itself. declarationSpecifierProblems checks every
// relative specifier left in a shipped declaration against that rule.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, posix, relative, resolve, sep } from 'node:path'

// Exact bare specifiers and the dist file that stands in for each package.
const BARE_TARGETS = new Map([
  ['@reference-ui/react', 'runtime/reference-ui/react/react.mjs'],
  ['@reference-ui/styled', 'runtime/reference-ui/styled/index.js'],
  ['@reference-ui/types', 'runtime/reference-ui/types/types.mjs'],
])

// Generated files that already ship at the package root through `files`.
const ROOT_SHIPPED = new Set(['system/baseSystem.mjs', 'system/baseSystem.d.mts'])

// Specifier positions in declaration text: `from '…'`, `import('…')`,
// `import '…'`, `require('…')`, ambient `module '…'`, and the triple-slash
// `<reference types="…" />` / `<reference path="…" />` directives.
const SPECIFIER_PATTERN =
  /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*|\bmodule\s+|<reference\s+(?:types|path)\s*=\s*)(['"])([^'"\n]+)\2/g

const GUARDED_PACKAGES = ['@reference-ui/react', '@reference-ui/styled', '@reference-ui/types']

// The declaration TypeScript reads beside each emitted runtime extension.
const DECLARATION_FOR_RUNTIME = new Map([
  ['.js', '.d.ts'],
  ['.mjs', '.d.mts'],
  ['.cjs', '.d.cts'],
])

const DECLARATION_FILE = /\.d\.(ts|mts|cts)$/
const SOURCE_EXTENSION = /\.(ts|tsx|mts|cts)$/

// Comments and string literals, matched left to right so a `//` inside a string never opens a comment.
// A `///` directive is excluded from the comment alternative: its <reference> path is real code.
const COMMENT_OR_STRING =
  /(?<!\/)\/\/(?!\/)[^\n]*|\/\*[\s\S]*?(?:\*\/|$)|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`/g

const toPosix = (path) => path.split(sep).join('/')
const isGuarded = (specifier) =>
  GUARDED_PACKAGES.some((name) => specifier === name || specifier.startsWith(`${name}/`))
const isRelative = (specifier) => specifier.startsWith('.')
const isComment = (token) => token.startsWith('//') || token.startsWith('/*')

function isFile(path) {
  try {
    return statSync(path).isFile()
  } catch {
    return false
  }
}

// Blanks each comment to spaces and keeps newlines, so match offsets in the result equal those in the source.
function maskComments(text) {
  return text.replace(COMMENT_OR_STRING, (token) => (isComment(token) ? token.replace(/[^\n]/g, ' ') : token))
}

// Each specifier in an import-like position of a declaration, with comments excluded.
function specifiersIn(text) {
  return [...maskComments(text).matchAll(SPECIFIER_PATTERN)].map((match) => match[3])
}

function relativeSpecifier(fromFile, target) {
  const rel = posix.relative(toPosix(dirname(fromFile)), toPosix(target))
  return rel.startsWith('.') ? rel : `./${rel}`
}

// Whether a path is a file the tarball ships: anything under dist/, or a root payload file.
function createShipCheck(packageRoot) {
  const distDir = join(packageRoot, 'dist')
  const rootFiles = new Set([...ROOT_SHIPPED].map((rel) => resolve(packageRoot, '.reference-ui', rel)))
  return (path) => (path.startsWith(`${distDir}${sep}`) || rootFiles.has(path)) && isFile(path)
}

// Why an emitted runtime name (`base` plus `ext`) does not resolve for both readers, or null when it does.
function unshippedRuntimeName(base, ext, shipped) {
  const declaration = `${base}${DECLARATION_FOR_RUNTIME.get(ext)}`
  if (!shipped(declaration)) return `has no shipped declaration at ${toPosix(declaration)}`
  const runtime = `${base}${ext}`
  const tastyDeclaration = `${base}.d.ts`
  if (shipped(runtime) || shipped(tastyDeclaration)) return null
  return `has no shipped file tasty can map to it (${toPosix(runtime)} or ${toPosix(tastyDeclaration)})`
}

// Why a dist target does not ship, or null. A runtime name needs the pair; any other name needs the file itself.
function unshippedTarget(target, shipped) {
  const ext = posix.extname(toPosix(target))
  if (DECLARATION_FOR_RUNTIME.has(ext)) return unshippedRuntimeName(target.slice(0, -ext.length), ext, shipped)
  return shipped(target) ? null : 'names no shipped file'
}

// Why a relative specifier in a shipped declaration names no shipped file, or null when it does.
function unshippedSpecifier(specifier, fromFile, shipped) {
  if (SOURCE_EXTENSION.test(specifier) && !DECLARATION_FILE.test(specifier)) {
    return 'keeps a TypeScript extension, which tasty cannot map to its declaration'
  }
  const target = resolve(dirname(fromFile), specifier)
  const ext = posix.extname(specifier)
  if (DECLARATION_FOR_RUNTIME.has(ext)) return unshippedRuntimeName(target.slice(0, -ext.length), ext, shipped)
  if (ext !== '') return shipped(target) ? null : 'names no shipped file'
  return [`${target}.d.ts`, join(target, 'index.d.ts')].some(shipped) ? null : 'names no shipped declaration'
}

function createSpecifierResolver({ packageRoot }) {
  const distDir = join(packageRoot, 'dist')
  const generatedDir = join(packageRoot, '.reference-ui')
  const shipped = createShipCheck(packageRoot)

  function shippedSpecifier(fromFile, distRelative, specifier) {
    const target = join(distDir, distRelative)
    const reason = unshippedTarget(target, shipped)
    if (reason !== null) {
      throw new Error(`rewrite-declaration-specifiers: "${specifier}" in ${toPosix(fromFile)} ${reason}`)
    }
    return relativeSpecifier(fromFile, target)
  }

  // Returns the replacement specifier, or null when the specifier already resolves in the tarball.
  return function resolveSpecifier(specifier, fromFile) {
    if (BARE_TARGETS.has(specifier)) {
      return shippedSpecifier(fromFile, BARE_TARGETS.get(specifier), specifier)
    }
    if (isGuarded(specifier)) {
      throw new Error(
        `rewrite-declaration-specifiers: no shipped target for "${specifier}" in ${toPosix(fromFile)}; add it to BARE_TARGETS`,
      )
    }
    if (!isRelative(specifier)) return null
    const target = resolve(dirname(fromFile), specifier)
    if (!target.startsWith(`${generatedDir}${sep}`)) return null
    const generated = toPosix(relative(generatedDir, target))
    if (ROOT_SHIPPED.has(generated)) return null
    return shippedSpecifier(fromFile, posix.join('runtime/reference-ui', generated), specifier)
  }
}

// Rewrites the relative specifiers of one declaration text that the resolver names. Comments are never rewritten.
export function rewriteSpecifierText(text, fromFile, resolveSpecifier) {
  const masked = maskComments(text)
  let out = ''
  let last = 0
  let count = 0
  for (const match of masked.matchAll(SPECIFIER_PATTERN)) {
    const [whole, keyword, quote, specifier] = match
    const replacement = resolveSpecifier(specifier, fromFile)
    if (replacement === null) continue
    out += text.slice(last, match.index) + keyword + quote + replacement + quote
    last = match.index + whole.length
    count += 1
  }
  return { text: out + text.slice(last), count }
}

function listDeclarationFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return listDeclarationFiles(full)
    return DECLARATION_FILE.test(entry.name) ? [full] : []
  })
}

export function rewriteDeclarationSpecifiers({ packageRoot }) {
  const resolveSpecifier = createSpecifierResolver({ packageRoot })
  const files = listDeclarationFiles(join(packageRoot, 'dist'))
  let rewritten = 0
  let filesChanged = 0
  for (const file of files) {
    const { text, count } = rewriteSpecifierText(readFileSync(file, 'utf8'), file, resolveSpecifier)
    if (count === 0) continue
    writeFileSync(file, text)
    rewritten += count
    filesChanged += 1
  }
  return { files: files.length, filesChanged, rewritten }
}

// Every relative specifier in a shipped declaration that names no shipped file, as printable problems.
export function declarationSpecifierProblems({ packageRoot }) {
  const shipped = createShipCheck(packageRoot)
  return listDeclarationFiles(join(packageRoot, 'dist')).flatMap((file) =>
    specifiersIn(readFileSync(file, 'utf8'))
      .filter(isRelative)
      .flatMap((specifier) => {
        const reason = unshippedSpecifier(specifier, file, shipped)
        return reason === null ? [] : [`${toPosix(relative(packageRoot, file))}: "${specifier}" ${reason}`]
      }),
  )
}
