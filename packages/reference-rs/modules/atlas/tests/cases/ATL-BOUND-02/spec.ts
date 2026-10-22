/**
 * Symlinked-root contract (ATL-BOUND-02). The station analyzes the committed `input/app` in process. This spec copies
 * that project into a temp directory it owns, links `link -> real` beside it, and analyzes the symlinked root, its
 * real path as given, and its canonical real path through the built atlas dist in child processes. All three must carry
 * the same components with the same counts, and the page's `Button` must be counted once. The parent removes the temp
 * directory, so a child that dies leaves nothing behind.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect } from 'vitest'
import { expectBounded, runIsolated, withTempDir } from '../../../../../testing/isolated.js'
import type { AtlasAnalysisResult } from '../../../js/index.js'
import type { AtlasCaseSpec } from '../../harness/helpers.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const INPUT_APP = path.join(HERE, 'input', 'app')
const KILL_MS = 30_000
const BUDGET_MS = 5_000

interface ComponentCount {
  name: string
  count: number
}

function analyzeAt(root: string): AtlasAnalysisResult {
  const run = runIsolated<AtlasAnalysisResult>({
    module: 'atlas',
    fn: 'analyzeDetailed',
    args: [root],
    timeoutMs: KILL_MS,
  })
  return expectBounded(run, { ms: BUDGET_MS })
}

/** Component names and counts in name order, so two results compare by content rather than walk order. */
function countsOf(result: AtlasAnalysisResult): ComponentCount[] {
  return result.components
    .map((component) => ({ name: component.name, count: component.count }))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
}

const spec: AtlasCaseSpec = {
  id: 'ATL-BOUND-02',
  verify() {
    withTempDir('atl-bound-02-', (dir) => {
      const real = path.join(dir, 'real')
      fs.cpSync(INPUT_APP, real, { recursive: true })
      const link = path.join(dir, 'link')
      fs.symlinkSync(real, link)
      const viaLink = countsOf(analyzeAt(link))
      const asGiven = countsOf(analyzeAt(real))
      const canonical = countsOf(analyzeAt(fs.realpathSync(link)))
      expect(viaLink, 'the symlinked root counts the same as the real path').toEqual(canonical)
      expect(asGiven, 'the real path as given counts the same as its canonical spelling').toEqual(canonical)
      expect(canonical).toEqual([{ name: 'Button', count: 1 }])
    })
  },
}

export default spec
