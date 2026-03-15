import { existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

import { packageDir } from '../shared/paths'
import { getRustTarget, getVirtualNativeTriple } from '../shared/targets'

const triple = getVirtualNativeTriple()
if (!triple) {
  throw new Error('Unsupported platform for @reference-ui/rust native build.')
}

const binaryPath = join(packageDir, `virtual-native.${triple}.node`)
if (existsSync(binaryPath)) {
  console.log(`Using existing native binary ${binaryPath}`)
  process.exit(0)
}

const target = getRustTarget(triple)
console.log(`Building native binary for ${target}`)

execFileSync('pnpm', ['run', 'build:native', '--', '--target', target], {
  cwd: packageDir,
  stdio: 'inherit',
  env: process.env,
})
