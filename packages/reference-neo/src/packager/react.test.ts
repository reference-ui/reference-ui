// React bundle map suite for the publish leg (F-A). It builds
// `publishReactBundle` for real, no bundler mock, in a scratch stage whose
// live twin sits at a real package depth, so the map's `../../../` external
// hops land on the repo's `packages/` exactly as a real sync's do. It asserts
// every emitted source absolutizes against the live folder to a file that
// exists, and that the stage-depth form (no live folder) leaves its external
// sources orphaned. The one synthetic source — the generated entry deleted
// from the scratch tmp — carries its bytes in `sourcesContent` and is
// asserted by name, not resolved.

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { commitStagedDir } from '../sync/commit.ts'
import { publishReactBundle } from './react.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
// A package's own depth: `.reference-ui` also lives one level under it, so the
// scratch live root reproduces the shipped relative geometry.
const PACKAGE_ROOT = resolve(HERE, '..', '..')
const SYNTHETIC_ENTRY = '../tmp/react-entry.mts'

let root = ''
let live = ''
let fixedSources: string[] = []
let stageSources: string[] = []

function readSources(mapPath: string): string[] {
  return (JSON.parse(readFileSync(mapPath, 'utf-8')) as { sources: string[] }).sources
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

beforeAll(async () => {
  root = mkdtempSync(join(PACKAGE_ROOT, '.react-maps-'))
  live = root
  const stagedLive = join(live, 'sync.stage')
  await publish(stagedLive, live)
  // The commit rename is what makes the live twins real.
  commitStagedDir(stagedLive, live)
  fixedSources = readSources(join(live, 'react', 'react.mjs.map'))
  const stageOnly = join(live, 'stage-only')
  await publish(stageOnly)
  stageSources = readSources(join(stageOnly, 'react', 'react.mjs.map'))
}, 120000)

afterAll(() => {
  if (root !== '') rmSync(root, { recursive: true, force: true })
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
})
