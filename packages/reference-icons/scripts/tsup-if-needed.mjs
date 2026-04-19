/**
 * Runs `tsup` only when `dist/` is missing, incomplete, or older than the
 * fingerprint of sources + build config (content-based, not mtime).
 *
 * Used so `pnpm dev` and other tasks that depend on this package avoid ~40s+
 * of tsup when nothing under `src/` or the bundler config changed.
 */

import { execSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(pkgRoot, 'dist')
const stampPath = join(distDir, '.reference-icons-src-fingerprint')

const extraRootFiles = ['tsup.config.ts', 'tsconfig.json', 'package.json']

async function walkFiles(dir) {
  /** @type {string[]} */
  const out = []
  const entries = await readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    const p = join(dir, e.name)
    if (e.isDirectory()) {
      out.push(...(await walkFiles(p)))
    } else if (e.isFile()) {
      out.push(p)
    }
  }
  return out
}

async function fingerprint() {
  const srcRoot = join(pkgRoot, 'src')
  const srcFiles = (await walkFiles(srcRoot)).sort((a, b) => a.localeCompare(b))
  const rootFiles = extraRootFiles
    .map((f) => join(pkgRoot, f))
    .filter((p) => existsSync(p))
    .sort((a, b) => a.localeCompare(b))

  const h = createHash('sha256')
  for (const abs of [...srcFiles, ...rootFiles]) {
    const rel = relative(pkgRoot, abs)
    h.update(rel)
    h.update('\0')
    h.update(await readFile(abs))
    h.update('\0')
  }
  return h.digest('hex')
}

async function main() {
  const current = await fingerprint()
  const force = process.env.FORCE_REFERENCE_ICONS_TSUP === '1'

  if (
    !force &&
    existsSync(join(distDir, 'index.mjs')) &&
    existsSync(join(distDir, 'index.d.ts')) &&
    existsSync(stampPath) &&
    (await readFile(stampPath, 'utf8')).trim() === current
  ) {
    console.error('@reference-ui/icons: dist is up to date, skipping tsup.')
    return
  }

  if (force) {
    console.error('@reference-ui/icons: FORCE_REFERENCE_ICONS_TSUP=1, running tsup…')
  } else {
    console.error('@reference-ui/icons: running tsup…')
  }
  execSync('pnpm exec tsup', { cwd: pkgRoot, stdio: 'inherit', env: process.env })

  await writeFile(stampPath, `${current}\n`, 'utf8')
}

await main()
