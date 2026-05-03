import { access, mkdir, rm, symlink } from 'node:fs/promises'
import { constants } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const bootstrapRoot = resolve(packageRoot, '..', '..', 'packages', 'reference-lib')
const scopeDir = resolve(packageRoot, 'node_modules', '@reference-ui')
const packageNames = ['react', 'styled', 'system', 'types']

await mkdir(scopeDir, { recursive: true })

for (const packageName of packageNames) {
  const sourceDir = resolve(bootstrapRoot, '.reference-ui', packageName)
  const linkPath = resolve(scopeDir, packageName)

  try {
    await access(sourceDir, constants.F_OK)
  } catch {
    throw new Error(
      `Missing bootstrap package at ${sourceDir}. Run "pnpm --filter @reference-ui/lib run sync" first.`
    )
  }

  await rm(linkPath, { recursive: true, force: true })
  await symlink(sourceDir, linkPath, 'dir')
}
