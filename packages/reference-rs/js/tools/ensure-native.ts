import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
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
]

if (existsSync(binaryPath)) {
  try {
    const require = createRequire(import.meta.url)
    const binding = require(binaryPath) as Record<string, unknown>
    const hasRequiredExports = requiredExports.every((name) => typeof binding[name] === 'function')
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

const target = getRustTarget(triple)
console.log(`Building native binary for ${target}`)

execFileSync('pnpm', ['run', 'build:native', '--', '--target', target], {
  cwd: packageDir,
  stdio: 'inherit',
  env: process.env,
})
