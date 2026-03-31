import { createRequire } from 'node:module'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

import { packageDir } from '../shared/paths'
import { getRustTarget, getVirtualNativeTriple } from '../shared/targets'

const triple = getVirtualNativeTriple()
if (!triple) {
  throw new Error('Unsupported platform for @reference-ui/rust native build.')
}

const binaryPath = join(packageDir, 'native', `virtual-native.${triple}.node`)
const requiredExports = [
  'rewriteCssImports',
  'rewriteCvaImports',
  'scanAndEmitModules',
  'analyzeAtlas',
]
const nativeInputs = [
  join(packageDir, 'Cargo.toml'),
  join(packageDir, 'Cargo.lock'),
  join(packageDir, 'build.rs'),
  join(packageDir, 'src'),
]

function latestModifiedAtMs(path: string): number {
  if (!existsSync(path)) {
    return 0
  }

  const stats = statSync(path)
  if (!stats.isDirectory()) {
    return stats.mtimeMs
  }

  let latest = stats.mtimeMs
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    latest = Math.max(latest, latestModifiedAtMs(join(path, entry.name)))
  }
  return latest
}

function nativeInputsChangedSinceBuild(): boolean {
  if (!existsSync(binaryPath)) {
    return true
  }

  const binaryModifiedAtMs = statSync(binaryPath).mtimeMs
  const latestInputModifiedAtMs = Math.max(
    ...nativeInputs.map(path => latestModifiedAtMs(path))
  )

  return latestInputModifiedAtMs > binaryModifiedAtMs
}

if (existsSync(binaryPath)) {
  if (nativeInputsChangedSinceBuild()) {
    console.log(`Rebuilding stale native binary ${binaryPath}`)
  } else {
    try {
      const require = createRequire(import.meta.url)
      const binding = require(binaryPath) as Record<string, unknown>
      const hasRequiredExports = requiredExports.every(
        name => typeof binding[name] === 'function'
      )
      const hasDeprecatedBundleExport = typeof binding.scanAndEmitBundle === 'function'
      if (hasRequiredExports && !hasDeprecatedBundleExport) {
        console.log(`Using existing native binary ${binaryPath}`)
        process.exit(0)
      }

      console.log(`Rebuilding stale native binary ${binaryPath}`)
    } catch {
      console.log(`Rebuilding unloadable native binary ${binaryPath}`)
    }
  }
}

const target = getRustTarget(triple)
console.log(`Building native binary for ${target}`)

execFileSync('pnpm', ['run', 'build:native', '--', '--target', target], {
  cwd: packageDir,
  stdio: 'inherit',
  env: process.env,
})
