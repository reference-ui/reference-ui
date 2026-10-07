// React bundle map suite for the publish leg (F-A). It builds
// `publishReactBundle` for real, no bundler mock, in a scratch stage whose
// live twin sits at a real package depth, so the map's `../../../` external
// hops land on the repo's `packages/` exactly as a real sync's do. It asserts
// every emitted source absolutizes against the live folder to a file that
// exists, and that the stage-depth form (no live folder) leaves its external
// sources orphaned. The one synthetic source — the generated entry deleted
// from the scratch tmp — carries its bytes in `sourcesContent` and is
// asserted by name, not resolved.
//
// The same file also unit-tests the live-map plugin's re-homing rules: a
// staged relative import reports at its live twin (B3D-P3-1), the stage-prefix
// test is separator-insensitive (B3D-P3-2), an unknown staged extension throws
// (B3D-P4-1), and a generic walk resolves every non-synthetic source of every
// emitted `.map` (B3D-P4-3).

import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { microBundleWithResult } from '../lib/microbundle/index.ts'
import { commitStagedDir } from '../sync/commit.ts'
import {
  isStagedPath,
  liveMapPathPlugin,
  publishReactBundle,
  stagedLoaderFor,
} from './react.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
// A package's own depth: `.reference-ui` also lives one level under it, so the
// scratch live root reproduces the shipped relative geometry.
const PACKAGE_ROOT = resolve(HERE, '..', '..')
const SYNTHETIC_ENTRY = '../tmp/react-entry.mts'

let root = ''
let stageBase = ''
let stageRoot = ''
let live = ''
let fixedSources: string[] = []
let stageSources: string[] = []

function readSources(mapPath: string): string[] {
  return (JSON.parse(readFileSync(mapPath, 'utf-8')) as { sources: string[] }).sources
}

function parseSources(map: string): string[] {
  return (JSON.parse(map) as { sources: string[] }).sources
}

async function publish(stage: string, liveOutDir?: string): Promise<void> {
  mkdirSync(join(stage, 'styled'), { recursive: true })
  writeFileSync(
    join(stage, 'styled', 'runtime-data.mjs'),
    'export const systemName = "probe"\nexport const runtimeData = {}\n',
    'utf-8'
  )
  await publishReactBundle({
    outDir: stage,
    ...(liveOutDir === undefined ? {} : { liveOutDir }),
    systemName: 'probe',
    stylePropNames: ['color', 'margin'],
    recipes: {},
  })
}

/** Sources that would not resolve from `reactDir`; the synthetic entry excluded. */
function orphanedSources(sources: string[], reactDir: string): string[] {
  return sources.filter(
    (source) => source !== SYNTHETIC_ENTRY && !existsSync(resolve(reactDir, source))
  )
}

// A source is synthetic when it points into a `tmp/` segment: the generated
// entry is written to the stage, read by esbuild, and deleted before commit, so
// it never exists post-sync (its bytes ride in `sourcesContent`).
function isSyntheticSource(source: string): boolean {
  return source.split(/[\\/]/).includes('tmp')
}

/** Every `.map` file under `dir`, recursive. */
function mapFiles(dir: string): string[] {
  const found: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) found.push(...mapFiles(full))
    else if (entry.isFile() && full.endsWith('.map')) found.push(full)
  }
  return found
}

/** Non-synthetic `sources` of one map, absolutized against the map's dir. */
function realMapSources(mapFile: string): string[] {
  const mapDir = dirname(mapFile)
  const sources = (JSON.parse(readFileSync(mapFile, 'utf-8')) as { sources?: unknown }).sources
  if (!Array.isArray(sources)) return []
  return sources
    .filter((source): source is string => typeof source === 'string')
    .filter((source) => !isSyntheticSource(source))
    .map((source) => resolve(mapDir, source))
}

// Every non-synthetic source of every `.map` under `dir` must absolutize to a
// real file. Generic on purpose: a future map-emitting leg is covered without
// a new test. Returns the counts so a caller can assert the guard saw work.
function assertEveryMapSourceResolves(dir: string): { maps: number; resolved: number } {
  const files = mapFiles(dir)
  let resolved = 0
  for (const mapFile of files) {
    for (const source of realMapSources(mapFile)) {
      expect(existsSync(source), `${source} resolves under ${mapFile}`).toBe(true)
      resolved += 1
    }
  }
  return { maps: files.length, resolved }
}

beforeAll(async () => {
  root = mkdtempSync(join(PACKAGE_ROOT, '.react-maps-'))
  live = root
  const stagedLive = join(live, 'sync.stage')
  await publish(stagedLive, live)
  // The commit rename is what makes the live twins real.
  commitStagedDir(stagedLive, live)
  fixedSources = readSources(join(live, 'react', 'react.mjs.map'))
  // A separate scratch one level deeper than `live`, so the stage-depth map's
  // external sources carry one extra `../` and orphan against `live/react`.
  // Kept off `live` so the generic map guard walks only committed output.
  stageBase = mkdtempSync(join(PACKAGE_ROOT, '.react-stage-'))
  stageRoot = join(stageBase, 'deep')
  mkdirSync(stageRoot, { recursive: true })
  await publish(stageRoot)
  stageSources = readSources(join(stageRoot, 'react', 'react.mjs.map'))
}, 120000)

afterAll(() => {
  if (root !== '') rmSync(root, { recursive: true, force: true })
  if (stageBase !== '') rmSync(stageBase, { recursive: true, force: true })
})

describe('react bundle map sources', () => {
  it('resolves every real source against the live folder', () => {
    const reactDir = join(live, 'react')
    expect(orphanedSources(fixedSources, reactDir)).toEqual([])
    expect(fixedSources).toContain(SYNTHETIC_ENTRY)
  })

  it('orphans the external sources from the stage-depth form (the F-A defect)', () => {
    // Without the live folder the map base is the stage, so every external
    // source points one `../` above the repo and devtools miss the file.
    const reactDir = join(live, 'react')
    expect(orphanedSources(stageSources, reactDir).length).toBeGreaterThan(0)
  })

  it('resolves every non-synthetic source of every emitted map (B3D-P4-3)', () => {
    const { maps, resolved } = assertEveryMapSourceResolves(live)
    expect(maps).toBeGreaterThanOrEqual(1)
    expect(resolved).toBeGreaterThanOrEqual(1)
  })
})

describe('live-map path predicate', () => {
  it('matches both separator forms and rejects sibling prefixes (B3D-P3-2)', () => {
    const stage = '/repo/.reference-ui/sync.stage'
    expect(isStagedPath(stage, '/repo/.reference-ui/sync.stage/tmp/entry.mts')).toBe(true)
    expect(isStagedPath(stage, '\\repo\\.reference-ui\\sync.stage\\tmp\\entry.mts')).toBe(true)
    expect(isStagedPath('\\repo\\.reference-ui\\sync.stage', '/repo/.reference-ui/sync.stage/x')).toBe(
      true
    )
    expect(isStagedPath(stage, stage)).toBe(true)
    expect(isStagedPath(stage, '/repo/.reference-ui/sync.stageX')).toBe(false)
    expect(isStagedPath(stage, '/repo/.reference-ui/live/react.mjs')).toBe(false)
  })

  it('throws on an unknown staged extension instead of defaulting to js (B3D-P4-1)', () => {
    expect(stagedLoaderFor('/stage/tmp/entry.mts')).toBe('ts')
    expect(stagedLoaderFor('/stage/styled/runtime-data.mjs')).toBe('js')
    expect(() => stagedLoaderFor('/stage/styled/theme.css')).toThrow(/no staged loader/)
  })
})

describe('live-map plugin re-homing', () => {
  it('re-homes a staged relative import to its live twin (B3D-P3-1)', async () => {
    const probe = mkdtempSync(join(PACKAGE_ROOT, '.react-rel-'))
    try {
      const stage = join(probe, 'sync.stage')
      const liveDir = join(probe, 'live')
      mkdirSync(join(stage, 'tmp'), { recursive: true })
      mkdirSync(join(stage, 'styled'), { recursive: true })
      writeFileSync(
        join(stage, 'tmp', 'entry.mts'),
        "import { other } from '../styled/other.mjs'\nexport const value = other\n",
        'utf-8'
      )
      writeFileSync(join(stage, 'styled', 'other.mjs'), 'export const other = 1\n', 'utf-8')

      const bundle = await microBundleWithResult(join(stage, 'tmp', 'entry.mts'), {
        format: 'esm',
        platform: 'browser',
        sourcemap: 'linked',
        outfile: join(liveDir, 'react', 'react.mjs'),
        plugins: [liveMapPathPlugin(stage, liveDir)],
      })
      expect(bundle.map).toBeDefined()
      const sources = parseSources(bundle.map ?? '{}')

      // The relative specifier re-homes to its live twin, never the stage depth.
      expect(sources).toContain('../styled/other.mjs')
      expect(sources.some((source) => source.includes('sync.stage'))).toBe(false)

      // The re-homed source resolves once the stage commits live.
      commitStagedDir(stage, liveDir)
      const mapDir = join(liveDir, 'react')
      for (const source of sources) {
        if (isSyntheticSource(source)) continue
        expect(existsSync(resolve(mapDir, source)), `${source} resolves`).toBe(true)
      }
    } finally {
      rmSync(probe, { recursive: true, force: true })
    }
  })
})
