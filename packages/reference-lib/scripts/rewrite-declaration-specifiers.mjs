// Repoints the specifiers in lib's emitted declarations at files that ship in
// the tarball. tsc keeps the names the source wrote: `@reference-ui/react`,
// `@reference-ui/styled`, `@reference-ui/types`, and relative `.reference-ui/`
// paths. None of those resolve for a consumer (only dist/ and the baseSystem
// payload are in `files`), so skipLibCheck: false fails on every component.
// Each one moves to the copy materialize-runtime writes under
// dist/runtime/reference-ui/. A guarded specifier with no shipped target fails
// the build instead of shipping a declaration that cannot resolve.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, posix, relative, resolve, sep } from 'node:path'

// Exact bare specifiers and the dist file that stands in for each package.
// Under TypeScript `.mjs` resolves to `.d.mts` and `.js` to `.d.ts`.
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

const toPosix = (path) => path.split(sep).join('/')

function declarationCompanion(file) {
  if (file.endsWith('.mjs')) return `${file.slice(0, -'.mjs'.length)}.d.mts`
  if (file.endsWith('.js')) return `${file.slice(0, -'.js'.length)}.d.ts`
  throw new Error(`rewrite-declaration-specifiers: cannot map ${file} to a declaration file`)
}

function isGuarded(specifier) {
  return GUARDED_PACKAGES.some((name) => specifier === name || specifier.startsWith(`${name}/`))
}

function relativeSpecifier(fromFile, target) {
  const rel = posix.relative(toPosix(dirname(fromFile)), toPosix(target))
  return rel.startsWith('.') ? rel : `./${rel}`
}

function createSpecifierResolver({ packageRoot }) {
  const distDir = join(packageRoot, 'dist')
  const generatedDir = join(packageRoot, '.reference-ui')

  function shippedSpecifier(fromFile, distRelative, specifier) {
    const target = join(distDir, distRelative)
    const companion = declarationCompanion(target)
    if (!existsSync(companion)) {
      throw new Error(
        `rewrite-declaration-specifiers: "${specifier}" in ${toPosix(fromFile)} has no shipped declaration at ${toPosix(companion)}`,
      )
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
    if (!specifier.startsWith('.')) return null
    const target = resolve(dirname(fromFile), specifier)
    if (!target.startsWith(`${generatedDir}${sep}`)) return null
    const generated = toPosix(relative(generatedDir, target))
    if (ROOT_SHIPPED.has(generated)) return null
    return shippedSpecifier(fromFile, posix.join('runtime/reference-ui', generated), specifier)
  }
}

export function rewriteSpecifierText(text, fromFile, resolveSpecifier) {
  let count = 0
  const next = text.replace(SPECIFIER_PATTERN, (match, keyword, quote, specifier) => {
    const replacement = resolveSpecifier(specifier, fromFile)
    if (replacement === null) return match
    count += 1
    return `${keyword}${quote}${replacement}${quote}`
  })
  return { text: next, count }
}

function listDeclarationFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return listDeclarationFiles(full)
    return /\.d\.(ts|mts|cts)$/.test(entry.name) ? [full] : []
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
