/**
 * Native artifact handling for `pnpm agentrs alloc`.
 *
 * It takes the reference-rs checkout and emits descriptors for both binaries
 * the capture needs: the shipped release `.node` (via ensure-native, owned by
 * run.mjs) and the release+alloc-trace instrument build, compiled by napi into
 * a hash-keyed directory under dist/native-trace/. The trace cache keys on
 * the same Cargo inputs hash as ensure-native, so it rebuilds exactly when
 * the Rust sources drift, and dist/native is never touched.
 */

import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { withCpuGate } from '../../test-core/scripts/cpu-gate.mjs'

const TRACE_FEATURE = 'alloc-trace'
const NATIVE_PATH_ENV = 'REFERENCE_UI_NATIVE_PATH'

function napiTriple() {
  if (process.platform === 'darwin') return process.arch === 'arm64' ? 'darwin-arm64' : 'darwin-x64'
  return 'linux-x64-gnu'
}

function shippedBinaryPath(rsDir) {
  return path.join(rsDir, 'dist', 'native', `virtual-native.${napiTriple()}.node`)
}

function traceBuildDir(rsDir, inputsHash) {
  return path.join(rsDir, 'dist', 'native-trace', inputsHash.slice(0, 12))
}

function traceBinaryPath(rsDir, inputsHash) {
  return path.join(traceBuildDir(rsDir, inputsHash), `virtual-native.${napiTriple()}.node`)
}

function sha256File(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex')
}

export function describeShippedNative(rsDir, skippedBuild) {
  const filePath = shippedBinaryPath(rsDir)
  if (!existsSync(filePath)) throw new Error(`native binary missing at ${filePath} — run pnpm agentrs build first`)
  return {
    path: path.relative(process.cwd(), filePath) || filePath,
    sha256: sha256File(filePath),
    profile: 'release',
    builtVia: skippedBuild ? 'prebuilt (ensure-native skipped with --no-build)' : 'napi build --release via ensure-native',
  }
}

export function describeTraceNative(rsDir, binaryPath, inputsHash) {
  return {
    path: path.relative(process.cwd(), binaryPath) || binaryPath,
    sha256: sha256File(binaryPath),
    profile: 'release+alloc-trace',
    builtVia: `napi build --release --features ${TRACE_FEATURE}`,
    inputsHash,
    bytes: statSync(binaryPath).size,
  }
}

function distLoaderPreflight(rsDir) {
  const distDir = path.join(rsDir, 'dist')
  const candidates = ['index.mjs', 'atomic.mjs', 'runtime.mjs']
  for (const file of candidates) {
    const full = path.join(distDir, file)
    if (existsSync(full) && readFileSync(full, 'utf-8').includes(NATIVE_PATH_ENV)) return
  }
  throw new Error(
    `dist JS predates the ${NATIVE_PATH_ENV} loader seam — run: pnpm --dir packages/reference-rs run build:js`,
  )
}

async function traceInputsHash(rsDir) {
  const rel = 'modules/runtime/js/shared/native-inputs.ts'
  const inputs = await import(pathToFileURL(path.join(rsDir, rel)).href)
  return inputs.hashNativeInputs(rsDir)
}

function traceBuildFresh(traceDir, binaryPath, inputsHash) {
  const stampPath = path.join(traceDir, 'inputs.sha256')
  if (!existsSync(binaryPath) || !existsSync(stampPath)) return false
  return readFileSync(stampPath, 'utf-8').trim() === inputsHash
}

async function buildTraceNative(rsDir, traceDir, inputsHash) {
  const binaryPath = traceBinaryPath(rsDir, inputsHash)
  if (traceBuildFresh(traceDir, binaryPath, inputsHash)) {
    console.log(`[agent-rs] alloc: reusing trace binary for inputs ${inputsHash.slice(0, 12)}`)
    return binaryPath
  }
  mkdirSync(traceDir, { recursive: true })
  const args = [
    'exec', 'napi', 'build',
    '--package', 'reference-virtual-native',
    '--platform', '--release',
    '--features', TRACE_FEATURE,
    '--output-dir', traceDir,
    '--no-js',
  ]
  console.log(`[agent-rs] alloc: napi build --release --features ${TRACE_FEATURE}`)
  const result = spawnSync('pnpm', args, { cwd: rsDir, stdio: 'inherit' })
  if (result.status !== 0) throw new Error(`trace native build failed (code ${result.status ?? '?'})`)
  if (!existsSync(binaryPath)) throw new Error(`trace native build produced no binary at ${binaryPath}`)
  writeFileSync(path.join(traceDir, 'inputs.sha256'), `${inputsHash}\n`)
  return binaryPath
}

export async function ensureTraceNative(ctx) {
  distLoaderPreflight(ctx.rsDir)
  const inputsHash = await traceInputsHash(ctx.rsDir)
  const traceDir = traceBuildDir(ctx.rsDir, inputsHash)
  const binaryPath = traceBinaryPath(ctx.rsDir, inputsHash)
  if (ctx.options.noBuild) {
    if (!traceBuildFresh(traceDir, binaryPath, inputsHash)) {
      throw new Error(`no fresh trace binary for inputs ${inputsHash.slice(0, 12)} — rebuild without --no-build`)
    }
    return { binaryPath, inputsHash }
  }
  const built = await withCpuGate('rs:build', `agentrs alloc build ${ctx.options.scale}`, () =>
    buildTraceNative(ctx.rsDir, traceDir, inputsHash),
  )
  return { binaryPath: built, inputsHash }
}
