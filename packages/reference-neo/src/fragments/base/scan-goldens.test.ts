// Four-scale golden reproduction (F1 §6.8 test 14): the diet replays the
// base-sealed goldens bit-exactly. It takes the seeded generators plus the
// committed fixtures and asserts matches, retention, stylesheet, runtime, and
// diagnostics reproduce on small, medium, enterprise, and churn, with ×3 scan
// determinism per scale. Regen fidelity re-proves first, so generator drift
// can never masquerade as diet drift.

import { createHash, randomUUID } from 'node:crypto'
import { readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolvePlan } from '../../../benchmark/generate/plans.ts'
import { generateRepo } from '../../../benchmark/generate/generators/index.ts'
import { loadUserConfig } from '../../config/load.ts'
import {
  evaluatePreparedFragments,
  prepareFragments,
  scanFragmentFiles,
  scanFragmentFilesNative,
} from './index.ts'
import { resolveJsxElements } from '../../sync/jsx-elements.ts'
import { compileNative, type ScopedCompileRequest } from '../../sync/native.ts'
import { applyNormalizeCss } from '../../sync/reset.ts'
import { PRIMITIVE_JSX_NAMES } from '../../primitives/tags.ts'
import type { ScannedSource } from '../lib/scanner.ts'
import {
  NEEDLES,
  atomic,
  byteSort,
  enumerateCandidates,
  expectedManifest,
  manifestSha,
  platformSep,
  releaseToken,
} from './scan-native-helpers.ts'

interface ScaleFixture {
  scale: string
  seed: number
  matches: string[]
  retainedCount: number
  manifestSha: string
  sourcesSha: string
  stylesheetSha: string
  stylesheetBytes: number
  portableSha: string | null
  runtimeSha: string
  tracedJsxHosts: string[]
  diagnostics: unknown[]
  diagnosticsSha: string
}

function loadFixture(scale: string): ScaleFixture {
  const path = join(import.meta.dirname, 'fixtures', `scan-goldens.${scale}.json`)
  return JSON.parse(readFileSync(path, 'utf-8')) as ScaleFixture
}

function sha256(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

/** Seal-mirror: sha over the byte-sorted rel-plus-content source forms. */
function sourcesShaOf(root: string, sources: ScannedSource[]): string {
  const forms = sources.map(source => `${relative(root, source.path)}\0${source.content}`)
  forms.sort(byteSort)
  return sha256(forms.join('\0'))
}

interface ScaleWorld {
  dir: string
  config: Awaited<ReturnType<typeof loadUserConfig>>
}

/** Regen one scale repo; the caller owns the dir and removes it after. */
async function regenScale(scale: string): Promise<ScaleWorld> {
  const dir = join(tmpdir(), `f1-golden-${scale}-${process.pid}-${randomUUID().slice(0, 8)}`)
  generateRepo(resolvePlan(scale, {}), dir)
  return { dir, config: await loadUserConfig(dir) }
}

/** Regen fidelity: the tip TS scan reproduces the sealed source bytes. */
async function assertTsFidelity(world: ScaleWorld, fixture: ScaleFixture) {
  const resealed = await scanFragmentFiles(world.dir, world.config)
  expect(sourcesShaOf(world.dir, resealed.scannedSources)).toBe(fixture.sourcesSha)
  return resealed
}

/** Diet path: native prepare, eval, and token compile (sync's shape). */
async function dietCompile(world: ScaleWorld) {
  const prepared = await prepareFragments(world.dir, world.config)
  expect(prepared.retentionToken).toBeDefined()
  expect(prepared.scannedSources).toEqual([])
  const spec = await evaluatePreparedFragments(world.dir, world.config, prepared)
  applyNormalizeCss(spec, world.config.normalizeCss)
  const requested = resolveJsxElements(world.config)
  const request: ScopedCompileRequest = {
    schemaVersion: 1,
    spec,
    jsxHosts: [...new Set([...requested.merged, ...PRIMITIVE_JSX_NAMES])].sort(),
    sourceRoot: world.dir,
    declarationRoot: world.dir,
    include: world.config.include,
    retentionToken: prepared.retentionToken,
  }
  return compileNative(request)
}

/** Matches plus retention reproduce the sealed goldens. */
async function assertScanGoldens(
  world: ScaleWorld,
  fixture: ScaleFixture,
  resealed: Awaited<ReturnType<typeof scanFragmentFiles>>
): Promise<void> {
  const native = await scanFragmentFilesNative(world.dir, world.config)
  try {
    const matchesRel = native.matches.map(match => relative(world.dir, match)).sort(byteSort)
    expect(matchesRel).toEqual(fixture.matches)
    expect(native.retention.count).toBe(fixture.retainedCount)
  } finally {
    await releaseToken(native.retention.token)
  }
  const mod = await atomic()
  const candidates = enumerateCandidates(world.dir, world.config.include)
  const manifested = await mod.scan({
    paths: candidates,
    needles: NEEDLES,
    cwd: world.dir,
    sep: platformSep(),
    manifest: true,
  })
  try {
    expect(manifestSha(manifested.manifest ?? [])).toBe(fixture.manifestSha)
    expect(manifested.manifest).toEqual(expectedManifest(world.dir, resealed.scannedSources))
  } finally {
    await releaseToken(manifested.retentionToken)
  }
}

/** Stylesheet, runtime, hosts, and diagnostics reproduce the sealed goldens. */
async function assertOutputGoldens(
  world: ScaleWorld,
  result: Awaited<ReturnType<typeof compileNative>>,
  fixture: ScaleFixture
): Promise<void> {
  expect(sha256(result.stylesheet)).toBe(fixture.stylesheetSha)
  expect(Buffer.byteLength(result.stylesheet, 'utf8')).toBe(fixture.stylesheetBytes)
  expect(result.portableStylesheet ? sha256(result.portableStylesheet) : null).toBe(
    fixture.portableSha
  )
  expect(sha256(JSON.stringify(result.runtime))).toBe(fixture.runtimeSha)
  expect(result.tracedJsxHosts ?? []).toEqual(fixture.tracedJsxHosts)
  const diagnosticsNorm = (result.diagnostics ?? [])
    .map(entry => ({
      ...entry,
      ...(entry.file && entry.file.startsWith(world.dir)
        ? { file: relative(world.dir, entry.file) }
        : {}),
    }))
    .sort((a, b) => byteSort(JSON.stringify(a), JSON.stringify(b)))
  expect(diagnosticsNorm).toEqual(fixture.diagnostics)
  expect(sha256(JSON.stringify(diagnosticsNorm))).toBe(fixture.diagnosticsSha)
}

/** ×3 scan determinism: matches identical across three fresh scans. */
async function assertDeterminism(world: ScaleWorld): Promise<void> {
  const first = await scanFragmentFilesNative(world.dir, world.config)
  try {
    for (let run = 0; run < 2; run++) {
      const next = await scanFragmentFilesNative(world.dir, world.config)
      try {
        expect(next.matches).toEqual(first.matches)
      } finally {
        await releaseToken(next.retention.token)
      }
    }
  } finally {
    await releaseToken(first.retention.token)
  }
}

async function reproduceScale(scale: string): Promise<void> {
  const fixture = loadFixture(scale)
  const world = await regenScale(scale)
  try {
    const resealed = await assertTsFidelity(world, fixture)
    const result = await dietCompile(world)
    await assertScanGoldens(world, fixture, resealed)
    await assertOutputGoldens(world, result, fixture)
    await assertDeterminism(world)
  } finally {
    rmSync(world.dir, { recursive: true, force: true })
  }
}

describe('four-scale goldens', () => {
  it(
    '(14) small/medium/enterprise/churn reproduce the base goldens',
    { timeout: 180_000 },
    async () => {
      for (const scale of ['small', 'medium', 'enterprise', 'churn']) {
        await reproduceScale(scale)
      }
    }
  )
})
