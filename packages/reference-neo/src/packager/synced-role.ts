// Synced role of a Neo project in the SyncedSystem register.
// It takes a project root and emits 'publisher' when the root's package.json names @reference-ui/lib, 'consumer' when node_modules/@reference-ui/lib exists at the root or any ancestor, and 'none' otherwise.
// The lib check is a plain filesystem walk, never require.resolve, since lib's exports map has no require or package.json entry. Publisher is checked first, so lib never augments its own register.

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

/** The role a project plays: it declares the register, fills it, or leaves it open. */
export type SyncedRole = 'publisher' | 'consumer' | 'none'

/** The package whose generated types declare SyncedSystem for consumers to fill. */
export const LIB_PACKAGE_NAME = '@reference-ui/lib'

/**
 * Detect the synced role of the project rooted at projectRoot. Publisher wins
 * over consumer: lib's own sync never emits the augmentation, since a second
 * declaration of its register would fail with TS2717. A package.json that is
 * not valid JSON throws, naming the file.
 */
export function detectSyncedRole(projectRoot: string): SyncedRole {
  const root = resolve(projectRoot)
  if (readPackageName(root) === LIB_PACKAGE_NAME) return 'publisher'
  return isLibInstalledAbove(root) ? 'consumer' : 'none'
}

/** Name from the root's package.json, or undefined when the file or its name is absent. */
function readPackageName(root: string): string | undefined {
  const file = join(root, 'package.json')
  if (!existsSync(file)) return undefined
  const parsed = parsePackageJson(file)
  if (typeof parsed !== 'object' || parsed === null || !('name' in parsed)) return undefined
  return typeof parsed.name === 'string' ? parsed.name : undefined
}

function parsePackageJson(file: string): unknown {
  try {
    return JSON.parse(readFileSync(file, 'utf-8'))
  } catch (error) {
    throw new Error(`synced-role: ${file} is not readable JSON`, { cause: error })
  }
}

/** True when node_modules/@reference-ui/lib exists at dir or at any ancestor of it. */
function isLibInstalledAbove(root: string): boolean {
  let dir = root
  while (!existsSync(join(dir, 'node_modules', '@reference-ui', 'lib'))) {
    const parent = dirname(dir)
    if (parent === dir) return false
    dir = parent
  }
  return true
}
