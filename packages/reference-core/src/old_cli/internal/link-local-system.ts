/**
 * INTERNAL: Local development symlink for @reference-ui/system
 *
 * This module is for developing the reference-ui monorepo itself. It is NOT
 * used by consumers who install @reference-ui/core from npm.
 *
 * What it does:
 * - When reference-core is a workspace package (not in node_modules), it
 *   symlinks packages/reference-core/src/system to the workspace root's
 *   node_modules/@reference-ui/system. That way other packages in the repo
 *   (e.g. reference-docs) resolve @reference-ui/system to the live source
 *   instead of a published build.
 *
 * When it runs:
 * - The CLI "link-system" command invokes this. That command is wired in
 *   reference-core's package.json postinstall so that after `pnpm install`
 *   (or when working from the repo root), the symlink is created automatically.
 *
 * When it does nothing:
 * - If coreDir contains "/node_modules/", this function returns immediately.
 *   So when a consumer has installed @reference-ui/core from the registry,
 *   postinstall runs from node_modules/@reference-ui/core and we skip linking.
 *   Consumers get real copied artifacts from the sync command instead.
 *
 * Do not rely on this from public API. It may be moved or removed.
 */

import {
  existsSync,
  lstatSync,
  mkdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { dirname, resolve } from 'node:path'

const SYSTEM_PACKAGE_JSON = `{
  "name": "@reference-ui/system",
  "version": "0.0.0-local",
  "private": true,
  "type": "module",
  "main": "./css/index.js",
  "types": "./css/index.d.ts",
  "exports": {
    ".": {
      "types": "./css/index.d.ts",
      "default": "./css/index.js"
    },
    "./css": {
      "types": "./css/index.d.ts",
      "default": "./css/index.js"
    },
    "./styles.css": "./styles.css"
  }
}
`

function findWorkspaceRoot(startDir: string): string | null {
  let current = startDir
  while (true) {
    if (existsSync(resolve(current, 'pnpm-workspace.yaml'))) {
      return current
    }
    const parent = resolve(current, '..')
    if (parent === current) return null
    current = parent
  }
}

/**
 * INTERNAL: Symlink core's src/system to workspace node_modules/@reference-ui/system.
 * No-op when running from an installed package (node_modules).
 */
export function linkLocalSystem(coreDir: string, cwd: string): void {
  if (coreDir.includes('/node_modules/')) return

  const workspaceRoot = findWorkspaceRoot(cwd) ?? findWorkspaceRoot(coreDir)
  if (!workspaceRoot) return

  const systemSource = resolve(coreDir, 'src/system')
  const systemTarget = resolve(workspaceRoot, 'node_modules/@reference-ui/system')

  mkdirSync(dirname(systemTarget), { recursive: true })

  if (existsSync(systemTarget)) {
    const stats = lstatSync(systemTarget)
    if (stats.isSymbolicLink() || stats.isDirectory()) {
      rmSync(systemTarget, { recursive: true, force: true })
    } else {
      return
    }
  }

  symlinkSync(systemSource, systemTarget, 'dir')
  writeFileSync(resolve(systemTarget, 'package.json'), SYSTEM_PACKAGE_JSON, 'utf-8')
}
