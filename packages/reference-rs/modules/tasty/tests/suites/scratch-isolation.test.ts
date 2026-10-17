/**
 * Regression guard for the tasty scratch roots under modules/tasty/.scratch.
 * Two module instances stand in for two test files running at once: each must own a distinct
 * root, and disposing one must leave the other's artifacts on disk. Before this guard every file
 * wrote the same case directory, so a reader could import a manifest or chunk that another
 * writer was still rewriting.
 */
import fs from 'node:fs'
import path from 'node:path'

import { afterAll, describe, expect, it, vi } from 'vitest'

import type * as Helpers from '../harness/helpers.js'

const loadedHarnesses: Array<typeof Helpers> = []

async function loadFreshHarness(): Promise<typeof Helpers> {
  vi.resetModules()
  const harness = await import('../harness/helpers.js')
  loadedHarnesses.push(harness)
  return harness
}

function writeMarker(caseDir: string): string {
  const file = path.join(caseDir, 'manifest.js')
  fs.mkdirSync(caseDir, { recursive: true })
  fs.writeFileSync(file, 'export default {}\n', 'utf-8')
  return file
}

afterAll(() => {
  for (const harness of loadedHarnesses) {
    harness.disposeTastyScratch()
  }
})

describe('tasty scratch isolation', () => {
  it('gives each module instance its own root under .scratch', async () => {
    const first = await loadFreshHarness()
    const second = await loadFreshHarness()

    const firstCaseDir = first.caseRuntimeDir('TST-DOC-01')
    const secondCaseDir = second.caseRuntimeDir('TST-DOC-01')

    expect(secondCaseDir).not.toBe(firstCaseDir)
    expect(path.dirname(path.dirname(firstCaseDir))).toBe(first.SCRATCH_DIR)
    expect(path.dirname(path.dirname(secondCaseDir))).toBe(second.SCRATCH_DIR)
  })

  it('disposes only its own root, leaving a concurrent sibling intact', async () => {
    const first = await loadFreshHarness()
    const second = await loadFreshHarness()

    const firstArtifact = writeMarker(first.caseRuntimeDir('TST-DOC-01'))
    const secondArtifact = writeMarker(second.caseRuntimeDir('TST-DOC-01'))

    first.disposeTastyScratch()

    expect(fs.existsSync(firstArtifact)).toBe(false)
    expect(fs.existsSync(secondArtifact)).toBe(true)
  })
})
