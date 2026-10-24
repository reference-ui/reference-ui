/**
 * Resolves the positional arguments of `pnpm agentrs q` into source files.
 *
 * Each argument is tried against the caller's cwd, this cwd, reference-rs and its
 * modules. Directories expand to their source files, a source file is kept, and
 * an existing file with another extension is reported in `skipped` (never dropped
 * silently) so the caller can name it. Arguments that match nothing land in
 * `unresolved`.
 */

import fs from 'node:fs'
import path from 'node:path'
import { findSourceFiles } from './complexity.mjs'

export function resolvePositionalTargets(rawArgs, rsDir, sourceExtensions) {
  const files = []
  const unresolved = []
  const skipped = []
  for (const raw of rawArgs) {
    const candidates = path.isAbsolute(raw)
      ? [raw]
      : [
          path.resolve(process.env.INIT_CWD || process.cwd(), raw),
          path.resolve(process.cwd(), raw),
          path.resolve(rsDir, raw),
          path.resolve(rsDir, 'modules', raw),
        ]
    const fullPath = candidates.find((p) => fs.existsSync(p))
    if (!fullPath) {
      unresolved.push(raw)
      continue
    }
    if (fs.statSync(fullPath).isDirectory()) {
      files.push(...findSourceFiles(fullPath, sourceExtensions))
    } else if (sourceExtensions.some((ext) => fullPath.endsWith(ext))) {
      files.push(fullPath)
    } else {
      skipped.push({ raw, path: fullPath })
    }
  }
  return { files, unresolved, skipped }
}
