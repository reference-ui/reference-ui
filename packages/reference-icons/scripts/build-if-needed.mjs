/**
 * Runs Rollup + declaration emit only when dist/ is missing, incomplete, or
 * older than the fingerprint of sources + build config.
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

const extraRootFiles = ['rollup.config.mjs', 'tsconfig.json', 'tsconfig.build.json', 'package.json']

async function walkFiles(dir) {
  const out = []
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const filePath = join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...(await walkFiles(filePath)))
    } else if (entry.isFile()) {
      out.push(filePath)
    }
  }
  return out
}

async function fingerprint() {
  const srcRoot = join(pkgRoot, 'src')
  const srcFiles = (await walkFiles(srcRoot)).sort((a, b) => a.localeCompare(b))
  const rootFiles = extraRootFiles
    .map(file => join(pkgRoot, file))
    .filter(filePath => existsSync(filePath))
    .sort((a, b) => a.localeCompare(b))

  const hash = createHash('sha256')
  for (const abs of [...srcFiles, ...rootFiles]) {
    const rel = relative(pkgRoot, abs)
    hash.update(rel)
    hash.update('\0')
    hash.update(await readFile(abs))
    hash.update('\0')
  }
  return hash.digest('hex')
}

async function main() {
  const current = await fingerprint()
  const force = process.env.FORCE_REFERENCE_ICONS_BUILD === '1'

  if (
    !force &&
    existsSync(join(distDir, 'index.mjs')) &&
    existsSync(join(distDir, 'index.d.ts')) &&
    existsSync(stampPath) &&
    (await readFile(stampPath, 'utf8')).trim() === current
  ) {
    console.error('@reference-ui/icons: dist is up to date, skipping build.')
    return
  }

  if (force) {
    console.error('@reference-ui/icons: FORCE_REFERENCE_ICONS_BUILD=1, running Rollup + tsc...')
  } else {
    console.error('@reference-ui/icons: running Rollup + tsc...')
  }

  execSync('pnpm run build:lib', { cwd: pkgRoot, stdio: 'inherit', env: process.env })
  execSync('pnpm run build:types', { cwd: pkgRoot, stdio: 'inherit', env: process.env })

  await writeFile(stampPath, `${current}\n`, 'utf8')
}

await main()