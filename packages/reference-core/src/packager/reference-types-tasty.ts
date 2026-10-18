// Inlines the rust tasty declarations that the published `types.d.mts` imports.
// The published types package must resolve on its own, so the declarations are
// read at publish time from the installed rust package (the same .d.ts it ships)
// and flattened into the file: one namespace per source module, with every
// import and re-export rewritten as an import alias. Nothing is hand-copied, so
// the inlined surface cannot drift from rust; an unsupported form throws.
import { existsSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const RUST_TASTY_SPECIFIER = '@reference-ui/rust/tasty'

const RUST_IMPORT = /import\s+type\s*\{([^}]*)\}\s*from\s*['"]@reference-ui\/rust\/tasty['"];?/
const RUST_SPECIFIER_LEFT = /(?:\bfrom\s*|\bimport\s*\(\s*)['"]@reference-ui\/rust/
const RELATIVE_SPECIFIER_LEFT = /(?:\bfrom\s*|\bimport\s*\(\s*)['"]\.\.?\//
const LIST_REEXPORT = /^(import|export)(?:\s+type)?\s*\{([^}]*)\}\s*from\s*(['"])(\.[^'"\n]+)\3;?[ \t]*$/gm
const INLINE_IMPORT = /import\(\s*(['"])(\.[^'"\n]+)\1\s*\)/g
const EMPTY_EXPORT = /^export \{\};?[ \t]*$/gm
const EXPORT_STAR = /^export\s*\*\s*from\s*(['"])(\.[^'"\n]+)\1/m
const UNSUPPORTED_EXPORT = /^export\s+(?:default\b|=|\*|(?:type\s+)?\{)/m
// Augmentations cannot live inside a namespace once `declare` is dropped.
const UNSUPPORTED_AMBIENT = /^(?:export\s+)?declare\s+(?:global|module)\b/m
const EXPORTED_NAME =
  /^export\s+(?:import\s+|const\s+enum\s+|abstract\s+class\s+|(?:interface|type|function|const|class|enum|namespace)\s+)(\w+)/gm

interface Specifier {
  remote: string
  local: string
}

function parseSpecifiers(list: string): Specifier[] {
  return list
    .split(',')
    .map((entry) => entry.trim().replace(/^type\s+/, ''))
    .filter((entry) => entry !== '')
    .map((entry) => {
      const match = /^(\w+)(?:\s+as\s+(\w+))?$/.exec(entry)
      if (match === null) throw new Error(`reference-types-tasty: unsupported specifier "${entry}"`)
      const remote = match[1] as string
      return { remote, local: match[2] ?? remote }
    })
}

function resolveModuleFile(fromFile: string, specifier: string): string {
  // Declaration imports name the emitted `.js` module; the file on disk is its `.d.ts`.
  const base = resolve(dirname(fromFile), specifier.replace(/\.[mc]?js$/, ''))
  for (const candidate of [`${base}.d.ts`, resolve(base, 'index.d.ts')]) {
    if (existsSync(candidate)) return candidate
  }
  throw new Error(`reference-types-tasty: cannot resolve "${specifier}" from ${fromFile}`)
}

function readDeclaration(file: string): string {
  try {
    return readFileSync(file, 'utf-8')
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    throw new Error(`reference-types-tasty: cannot read rust tasty declarations at ${file} (${reason})`)
  }
}

// `@reference-ui/rust/tasty` resolves to dist/tasty.mjs; its declarations sit
// beside it and re-export the module tree from one `export *` edge.
function resolveRustTastyRoot(): string {
  const entry = fileURLToPath(import.meta.resolve(RUST_TASTY_SPECIFIER)).replace(/\.mjs$/, '.d.ts')
  const star = EXPORT_STAR.exec(readDeclaration(entry))
  if (star === null) throw new Error(`reference-types-tasty: ${entry} has no export * entry`)
  return resolveModuleFile(entry, star[2] as string)
}

// The module edges the transform rewrites: re-export lists and inline import types.
function relativeEdges(text: string): string[] {
  const listEdges = [...text.matchAll(LIST_REEXPORT)].map((match) => match[4] as string)
  const inlineEdges = [...text.matchAll(INLINE_IMPORT)].map((match) => match[2] as string)
  return [...listEdges, ...inlineEdges]
}

function collectModules(rootFile: string): Map<string, string> {
  const modules = new Map<string, string>()
  const queue = [rootFile]
  for (let file = queue.shift(); file !== undefined; file = queue.shift()) {
    if (modules.has(file)) continue
    const text = readDeclaration(file)
    modules.set(file, text)
    for (const specifier of relativeEdges(text)) queue.push(resolveModuleFile(file, specifier))
  }
  const rootDir = dirname(rootFile)
  // Code-point order, not localeCompare: the published file must not depend on the host locale.
  const byPath = (a: string, b: string): number => {
    const left = relative(rootDir, a)
    const right = relative(rootDir, b)
    return left < right ? -1 : left > right ? 1 : 0
  }
  return new Map([...modules].sort(([a], [b]) => byPath(a, b)))
}

function namespaceName(rootDir: string, file: string): string {
  const stem = relative(rootDir, file).replace(/\.d\.ts$/, '')
  const parts = stem.split(/[\\/]/).map((part) => (part === '..' ? 'up' : part))
  return `__rust_tasty_${parts.join('_').replace(/[^A-Za-z0-9_]/g, '_')}`
}

function assertSupported(original: string, flattened: string): void {
  const unsupported = UNSUPPORTED_AMBIENT.exec(original) ?? UNSUPPORTED_EXPORT.exec(flattened)
  if (unsupported !== null) {
    throw new Error(`reference-types-tasty: unsupported form "${unsupported[0]}" in a rust tasty module`)
  }
}

// A name the entry imports must be exported by the namespace it is aliased from,
// otherwise the alias would publish as a dangling reference.
function assertExported(block: string, namespace: string, names: string[]): void {
  const exported = new Set([...block.matchAll(EXPORTED_NAME)].map((match) => match[1]))
  const missing = names.filter((name) => !exported.has(name))
  if (missing.length > 0) {
    throw new Error(`reference-types-tasty: rust tasty no longer exports ${missing.join(', ')} (from ${namespace})`)
  }
}

/**
 * Flatten one rust tasty module into a `declare namespace`. Re-export lists
 * become import aliases (`export import`), inline `import("./x")` types become
 * the target namespace, and ambient `declare` prefixes are dropped because the
 * namespace is already ambient. `targetOf` maps a relative specifier to the
 * namespace of the module it resolves to.
 */
export function transformRustTastyModule(
  text: string,
  namespace: string,
  targetOf: (specifier: string) => string,
): string {
  const withoutEmpty = text.replace(EMPTY_EXPORT, '')
  const aliased = withoutEmpty.replace(LIST_REEXPORT, (...match: string[]) => {
    const [, kind = '', list = '', , specifier = ''] = match
    const target = targetOf(specifier)
    return parseSpecifiers(list)
      .map(({ remote, local }) => `${kind === 'export' ? 'export ' : ''}import ${local} = ${target}.${remote};`)
      .join('\n')
  })
  const inlined = aliased.replace(INLINE_IMPORT, (_match, _quote: string, specifier: string) => targetOf(specifier))
  const ambient = inlined.replace(/^export declare /gm, 'export ').replace(/^declare /gm, '')
  assertSupported(text, ambient)
  return `declare namespace ${namespace} {\n${ambient}\n}\n`
}

/**
 * Replace the entry's `import type {...} from '@reference-ui/rust/tasty'` with
 * the flattened rust tasty modules plus one top-level import alias per imported
 * name, then prove the result carries no rust or relative module specifier.
 */
export function inlineRustTastyTypes(entrySource: string): string {
  const entry = RUST_IMPORT.exec(entrySource)
  if (entry === null) throw new Error(`reference-types-tasty: entry has no import from "${RUST_TASTY_SPECIFIER}"`)
  const root = resolveRustTastyRoot()
  const rootDir = dirname(root)
  const modules = collectModules(root)
  const namespaces = new Map<string, string>(
    [...modules.keys()].map((file): [string, string] => [file, namespaceName(rootDir, file)]),
  )
  if (new Set(namespaces.values()).size !== namespaces.size) {
    throw new Error('reference-types-tasty: two rust tasty modules map to one namespace')
  }
  const namespaceOf = (file: string): string => {
    const namespace = namespaces.get(file)
    if (namespace === undefined) throw new Error(`reference-types-tasty: ${file} is outside the rust tasty closure`)
    return namespace
  }
  const blocks = new Map(
    [...modules].map(([file, text]) => [
      file,
      transformRustTastyModule(text, namespaceOf(file), (specifier) => namespaceOf(resolveModuleFile(file, specifier))),
    ]),
  )
  const imported = parseSpecifiers(entry[1] as string)
  assertExported(blocks.get(root) as string, namespaceOf(root), imported.map(({ remote }) => remote))
  const aliases = imported.map(({ remote, local }) => `import ${local} = ${namespaceOf(root)}.${remote};`)
  const inlined = `${[...blocks.values()].join('\n')}\n${aliases.join('\n')}\n`
  const output = entrySource.replace(entry[0], () => inlined)
  if (RUST_SPECIFIER_LEFT.test(output)) throw new Error('reference-types-tasty: output still imports @reference-ui/rust')
  if (RELATIVE_SPECIFIER_LEFT.test(output)) throw new Error('reference-types-tasty: output still has a relative module specifier')
  return output
}
