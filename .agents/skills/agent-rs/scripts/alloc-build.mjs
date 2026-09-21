/**
 * Native artifact handling for `pnpm agentrs alloc` and `pnpm agentrs counters`.
 *
 * It takes the reference-rs checkout and emits descriptors for both binaries
 * each capture needs: the shipped release `.node` (via ensure-native, owned by
 * run.mjs) and the feature-gated instrument build, compiled by napi into a
 * hash-keyed directory under dist/native-trace/. The alloc trace keeps the
 * bare hash directory; the counters build takes a `-counters` suffix so the
 * two features never collide. The cache keys on the same Cargo inputs hash as
 * ensure-native, so it rebuilds exactly when the Rust sources drift, and
 * dist/native is never touched.
 */

import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { withCpuGate } from '../../test-core/scripts/cpu-gate.mjs'

const TRACE_FEATURE = 'alloc-trace'
const COUNTERS_FEATURE = 'counters-trace'
const NATIVE_PATH_ENV = 'REFERENCE_UI_NATIVE_PATH'

function napiTriple() {
  if (process.platform === 'darwin') return process.arch === 'arm64' ? 'darwin-arm64' : 'darwin-x64'
  return 'linux-x64-gnu'
}

function shippedBinaryPath(rsDir) {
  return path.join(rsDir, 'dist', 'native', `virtual-native.${napiTriple()}.node`)
}

function instrumentBuildDir(rsDir, inputsHash, suffix) {
  return path.join(rsDir, 'dist', 'native-trace', `${inputsHash.slice(0, 12)}${suffix}`)
}

function instrumentBinaryPath(rsDir, inputsHash, suffix) {
  return path.join(instrumentBuildDir(rsDir, inputsHash, suffix), `virtual-native.${napiTriple()}.node`)
}

function traceBuildDir(rsDir, inputsHash) {
  return instrumentBuildDir(rsDir, inputsHash, '')
}

function traceBinaryPath(rsDir, inputsHash) {
  return instrumentBinaryPath(rsDir, inputsHash, '')
}

function countersBuildDir(rsDir, inputsHash) {
  return instrumentBuildDir(rsDir, inputsHash, '-counters')
}

function countersBinaryPath(rsDir, inputsHash) {
  return instrumentBinaryPath(rsDir, inputsHash, '-counters')
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
  return describeInstrumentNative(rsDir, binaryPath, inputsHash, TRACE_FEATURE)
}

export function describeCountersNative(rsDir, binaryPath, inputsHash) {
  return describeInstrumentNative(rsDir, binaryPath, inputsHash, COUNTERS_FEATURE)
}

function describeInstrumentNative(rsDir, binaryPath, inputsHash, feature) {
  return {
    path: path.relative(process.cwd(), binaryPath) || binaryPath,
    sha256: sha256File(binaryPath),
    profile: `release+${feature}`,
    builtVia: `napi build --release --features ${feature}`,
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
  return buildInstrumentNative(rsDir, traceDir, inputsHash, TRACE_FEATURE, 'alloc')
}

async function buildInstrumentNative(rsDir, traceDir, inputsHash, feature, tag) {
  const binaryPath = path.join(traceDir, `virtual-native.${napiTriple()}.node`)
  if (traceBuildFresh(traceDir, binaryPath, inputsHash)) {
    console.log(`[agent-rs] ${tag}: reusing ${feature} binary for inputs ${inputsHash.slice(0, 12)}`)
    return binaryPath
  }
  mkdirSync(traceDir, { recursive: true })
  const args = [
    'exec', 'napi', 'build',
    '--package', 'reference-virtual-native',
    '--platform', '--release',
    '--features', feature,
    '--output-dir', traceDir,
    '--no-js',
  ]
  console.log(`[agent-rs] ${tag}: napi build --release --features ${feature}`)
  const result = spawnSync('pnpm', args, { cwd: rsDir, stdio: 'inherit' })
  if (result.status !== 0) throw new Error(`${tag} native build failed (code ${result.status ?? '?'})`)
  if (!existsSync(binaryPath)) throw new Error(`${tag} native build produced no binary at ${binaryPath}`)
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

export async function ensureCountersNative(ctx) {
  distLoaderPreflight(ctx.rsDir)
  const inputsHash = await traceInputsHash(ctx.rsDir)
  const traceDir = countersBuildDir(ctx.rsDir, inputsHash)
  const binaryPath = countersBinaryPath(ctx.rsDir, inputsHash)
  if (ctx.options.noBuild) {
    if (!traceBuildFresh(traceDir, binaryPath, inputsHash)) {
      throw new Error(`no fresh counters binary for inputs ${inputsHash.slice(0, 12)} — rebuild without --no-build`)
    }
    return { binaryPath, inputsHash }
  }
  const built = await withCpuGate('rs:build', `agentrs counters build ${ctx.options.scale}`, () =>
    buildInstrumentNative(ctx.rsDir, traceDir, inputsHash, COUNTERS_FEATURE, 'counters'),
  )
  return { binaryPath: built, inputsHash }
}
