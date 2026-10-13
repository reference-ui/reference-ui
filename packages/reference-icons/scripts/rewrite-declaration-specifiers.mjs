// Declaration post-pass for the shipped icons package, run after tsc and materialize-runtime.
// tsc keeps the extensionless relative names the source wrote (`./types`, `./generated/index`,
// `../types`), which node16 and nodenext reject. The barrel then never resolves, so every icon
// re-export in a consumer's declarations becomes TS2305. Each relative specifier gets the extension
// of the declaration it names: `.js` for `.d.ts`, `.mjs` for `.d.mts`, `.cjs` for `.d.cts`. TypeScript
// maps those names back to their declarations, and tasty reads `.js` as the `.d.ts` beside it.
// declarationSpecifierProblems fails the build on any relative specifier in a shipped declaration that
// has no extension or names no shipped declaration. Comments are masked first, so prose never counts.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, posix, relative, resolve, sep } from 'node:path'

// The extension an extensionless relative specifier takes from the declaration it names.
const EXTENSION_FOR_DECLARATION = [
  ['.d.ts', '.js'],
  ['.d.mts', '.mjs'],
  ['.d.cts', '.cjs'],
]
// The declaration TypeScript reads for each emitted extension a specifier may keep.
const DECLARATION_FOR_EXTENSION = new Map(EXTENSION_FOR_DECLARATION.map(([declaration, ext]) => [ext, declaration]))

// Specifier positions in declaration text: `from '…'`, `import('…')`, `import '…'`, `require('…')`,
// ambient `module '…'`, and the triple-slash `<reference types|path="…" />` directives.
const SPECIFIER_PATTERN =
  /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*|\bmodule\s+|<reference\s+(?:types|path)\s*=\s*)(['"])([^'"\n]+)\2/g

const DECLARATION_FILE = /\.d\.(ts|mts|cts)$/
const SOURCE_EXTENSION = /\.(ts|tsx|mts|cts)$/
const REFERENCE_PACKAGE = /^@reference-ui\//

// Comments and string literals, matched left to right so a `//` inside a string never opens a comment.
// A `///` directive is excluded from the comment alternative: its <reference> path is real code.
const COMMENT_OR_STRING =
  /(?<!\/)\/\/(?!\/)[^\n]*|\/\*[\s\S]*?(?:\*\/|$)|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`/g

const toPosix = (path) => path.split(sep).join('/')
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

function listDeclarationFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return listDeclarationFiles(full)
    return DECLARATION_FILE.test(entry.name) ? [full] : []
  })
}

// Whether a path is a file under dist/, the only directory the tarball ships for declarations.
function createShipCheck(distDir) {
  return (path) => path.startsWith(`${distDir}${sep}`) && isFile(path)
}

// The specifier with the extension of the declaration it names, at the target or at target/index.
// Null when no declaration sits there, so the guard names the specifier.
function extensionlessSpecifier(specifier, target) {
  if (posix.extname(specifier) !== '') return null
  const directory = specifier === '.' || specifier === '..' || specifier.endsWith('/')
  const direct = directory
    ? undefined
    : EXTENSION_FOR_DECLARATION.find(([declaration]) => isFile(`${target}${declaration}`))
  if (direct !== undefined) return `${specifier}${direct[1]}`
  const index = EXTENSION_FOR_DECLARATION.find(([declaration]) => isFile(join(target, `index${declaration}`)))
  if (index === undefined) return null
  return `${specifier.endsWith('/') ? specifier : `${specifier}/`}index${index[1]}`
}

// Why a relative specifier in a shipped declaration names no shipped declaration, or null when it does.
function unshippedSpecifier(specifier, fromFile, shipped) {
  if (SOURCE_EXTENSION.test(specifier) && !DECLARATION_FILE.test(specifier)) {
    return 'keeps a TypeScript extension, which tasty cannot map to its declaration'
  }
  const ext = posix.extname(specifier)
  if (ext === '') return 'has no file extension, which node16 and nodenext reject'
  const target = resolve(dirname(fromFile), specifier)
  const declaration = DECLARATION_FOR_EXTENSION.get(ext)
  if (declaration !== undefined) {
    const declared = `${target.slice(0, -ext.length)}${declaration}`
    return shipped(declared) ? null : `has no shipped declaration at ${toPosix(declared)}`
  }
  return shipped(target) ? null : 'names no shipped file'
}

// Repoints each extensionless relative specifier of one declaration text. Comments are never rewritten.
function rewriteSpecifierText(text, fromFile) {
  const masked = maskComments(text)
  let out = ''
  let last = 0
  let count = 0
  for (const match of masked.matchAll(SPECIFIER_PATTERN)) {
    const [whole, keyword, quote, specifier] = match
    const replacement = isRelative(specifier)
      ? extensionlessSpecifier(specifier, resolve(dirname(fromFile), specifier))
      : null
    if (replacement === null) continue
    out += text.slice(last, match.index) + keyword + quote + replacement + quote
    last = match.index + whole.length
    count += 1
  }
  return { text: out + text.slice(last), count }
}

export function rewriteDeclarationSpecifiers({ packageRoot }) {
  const files = listDeclarationFiles(join(packageRoot, 'dist'))
  let rewritten = 0
  let filesChanged = 0
  for (const file of files) {
    const { text, count } = rewriteSpecifierText(readFileSync(file, 'utf8'), file)
    if (count === 0) continue
    writeFileSync(file, text)
    rewritten += count
    filesChanged += 1
  }
  return { files: files.length, filesChanged, rewritten }
}

// Every specifier in a shipped declaration that icons cannot resolve, as printable problems: a relative one with
// no extension or no shipped declaration, and a bare @reference-ui one. Icons ships and depends on no such package;
// the registry 0.0.43 runtime types import `@reference-ui/styled/...`, which TypeScript reports as TS2307.
export function declarationSpecifierProblems({ packageRoot }) {
  const distDir = join(packageRoot, 'dist')
  const shipped = createShipCheck(distDir)
  return listDeclarationFiles(distDir).flatMap((file) => {
    const masked = maskComments(readFileSync(file, 'utf8'))
    const label = toPosix(relative(packageRoot, file))
    return [...masked.matchAll(SPECIFIER_PATTERN)].map((match) => match[3]).flatMap((specifier) => {
      if (REFERENCE_PACKAGE.test(specifier)) {
        return [`${label}: "${specifier}" names a @reference-ui package that icons does not ship`]
      }
      const reason = isRelative(specifier) ? unshippedSpecifier(specifier, file, shipped) : null
      return reason === null ? [] : [`${label}: "${specifier}" ${reason}`]
    })
  })
}
