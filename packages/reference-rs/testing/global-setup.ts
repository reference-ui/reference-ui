/**
 * Vitest globalSetup for the reference-rs suites. Vitest runs it once per invocation in the main process, before any
 * worker starts, so the dist freshness verdict is computed once per run instead of once per test file. setup writes
 * the verdict and the dist state it came from to a marker in a fresh temp directory, then names that marker in
 * VERDICT_FILE_ENV, which workers inherit. teardown removes both. If the verdict cannot be computed, setup warns and
 * leaves no marker, so each process computes its own verdict and reports the same error when a case needs the dist.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { VERDICT_FILE_ENV, writeDistVerdictMarker } from './dist-freshness.js'

let markerDir: string | undefined

export function setup(): void {
  try {
    markerDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rs-dist-verdict-'))
    const file = path.join(markerDir, 'verdict.json')
    writeDistVerdictMarker(file)
    process.env[VERDICT_FILE_ENV] = file
  } catch (error) {
    console.warn(`[reference-rs] dist verdict not cached for this run: ${String(error)}`)
    removeMarkerDir()
  }
}

export function teardown(): void {
  delete process.env[VERDICT_FILE_ENV]
  removeMarkerDir()
}

function removeMarkerDir(): void {
  if (markerDir !== undefined) fs.rmSync(markerDir, { recursive: true, force: true })
  markerDir = undefined
}
