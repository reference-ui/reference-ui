/**
 * Repo paths for the docs-corpus tooling, found from this file's location so they
 * hold whatever the cwd is. The tooling is tracked in .agents/docs-corpus; the
 * clones, manifest.json and _normalized/ are data in vendor/docs and stay gitignored.
 */

import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const LIB = dirname(fileURLToPath(import.meta.url))

/** The repo root: up from lib/ through normalize, docs-corpus and .agents. */
export const REPO = resolve(LIB, '..', '..', '..', '..')

/** The corpus data: the `<source>/` clones, `manifest.json`, `_normalized/` and `_staging/`. */
export const VENDOR = join(REPO, 'vendor', 'docs')
