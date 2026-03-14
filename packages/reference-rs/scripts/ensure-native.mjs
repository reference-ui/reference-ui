import { existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { getCurrentTriple, supportedTargets } from './native-targets.mjs'
import { packageDir } from './paths.mjs'

const triple = getCurrentTriple()
if (!triple) {
  throw new Error('Unsupported platform for @reference-ui/reference-rs native build.')
}

const binaryPath = join(packageDir, `virtual-native.${triple}.node`)
if (existsSync(binaryPath)) {
  console.log(`Using existing native binary ${binaryPath}`)
  process.exit(0)
}

const target = supportedTargets[triple]
console.log(`Building native binary for ${target}`)

execFileSync('pnpm', ['run', 'build:native', '--', '--target', target], {
  cwd: packageDir,
  stdio: 'inherit',
  env: process.env,
})
