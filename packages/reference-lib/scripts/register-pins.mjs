// SyncedSystem guard (W3): fails the lib build when a shipped declaration names
// lib's own publisher register types. A component left to inference expands the
// register's conditionals at lib build and pins the publisher's LocalStyle* types,
// so a consumer's synced fill never reaches its props. dist/runtime is exempt:
// the publisher's react.d.mts is where those names are declared.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Publisher-only names that no consumer-reachable declaration may name. */
export const PINNED_REGISTER_NAMES = ['LocalStyleProps', 'LocalStylePropName', 'LocalPrimitiveCssProp']

const DECLARATION_FILE = /\.d\.(ts|mts|cts)$/
const EXEMPT_TOP_DIR = 'runtime'

/** Declaration files under distDir, relative to it, skipping the exempt top-level runtime dir. */
function listDeclarations(distDir, dir = distDir, prefix = '') {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const rel = prefix + entry.name
    if (entry.isDirectory()) {
      if (prefix === '' && entry.name === EXEMPT_TOP_DIR) return []
      return listDeclarations(distDir, join(dir, entry.name), `${rel}/`)
    }
    return DECLARATION_FILE.test(entry.name) ? [rel] : []
  })
}

/** Each shipped declaration outside dist/runtime that names a pinned register type. */
export function findRegisterPins(distDir) {
  return listDeclarations(distDir).flatMap((rel) => {
    const text = readFileSync(join(distDir, rel), 'utf8')
    const names = PINNED_REGISTER_NAMES.filter((name) => new RegExp(`\\b${name}\\b`).test(text))
    return names.length > 0 ? [{ file: rel, names }] : []
  })
}

/** Throws, naming every pinned file, so the build fails instead of shipping a pinned type. */
export function assertNoRegisterPins(distDir) {
  const pins = findRegisterPins(distDir)
  if (pins.length === 0) return
  const lines = pins.map((pin) => `  dist/${pin.file}: ${pin.names.join(', ')}`)
  throw new Error(
    [
      `register-pins: ${pins.length} shipped declaration(s) name lib's publisher register types,`,
      "so a consumer's synced fill never reaches their props. Annotate the component by its props",
      'alias, e.g. `export const X: React.ForwardRefExoticComponent<XProps & React.RefAttributes<E>>`:',
      ...lines,
    ].join('\n'),
  )
}
