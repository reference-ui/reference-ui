/**
 * Imports a TypeScript module from the clone together with its relative
 * imports. Each file is type-stripped, its `./` imports are rewritten to the
 * `data:` URLs of the same transform, and type-only `@/types` imports are
 * dropped (they are used in type positions only). Nothing is written to disk.
 */

import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { stripTypeScriptTypes } from 'node:module'

const TYPES_IMPORT = /^import\s+(?:type\s+)?\{[^}]*\}\s+from\s+['"]@\/types['"];?[ \t]*$/gm
const RELATIVE_FROM = /\bfrom\s+(['"])(\.{1,2}\/[^'"\n]+)\1/g

function tsFile(base) {
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
  }
  throw new Error(`cannot resolve ${base}`)
}

/** Imports the module at `entry` (absolute path). */
export async function importTsModule(entry) {
  const urls = new Map()
  const active = new Set()
  const urlOf = file => {
    if (urls.has(file)) return urls.get(file)
    if (active.has(file)) throw new Error(`import cycle through ${file}`)
    active.add(file)
    const stripped = stripTypeScriptTypes(readFileSync(file, 'utf8').replace(TYPES_IMPORT, ''))
    const js = stripped.replace(
      RELATIVE_FROM,
      (_, quote, spec) => `from ${quote}${urlOf(tsFile(resolve(dirname(file), spec)))}${quote}`
    )
    active.delete(file)
    const url = `data:text/javascript;base64,${Buffer.from(js).toString('base64')}`
    urls.set(file, url)
    return url
  }
  return import(urlOf(entry))
}
