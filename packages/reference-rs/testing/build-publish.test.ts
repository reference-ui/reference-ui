/**
 * Tests for the bundle publish in scripts/build-bundle.mjs. A reader of dist/ must never find an output missing while a build
 * publishes, so these run publishBundle against real files and sample every output between two steps. The sample runs
 * synchronously between steps, so the check is deterministic: nothing is timed or polled. The cases pin the order (the
 * replacements, then the removal of retired outputs, then the stamp), and that a failed replacement removes nothing and
 * writes no stamp.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { publishBundle } from '../scripts/build-bundle.mjs'
import { BUNDLE_STAMP_FILE } from '../scripts/bundle-stamp.mjs'

const OLD: Record<string, string> = {
  'index.mjs': 'old index\n',
  'atlas.mjs': 'old atlas\n',
  'tasty/browser.mjs': 'old browser\n',
}
const NEW: Record<string, string> = {
  'index.mjs': 'new index\n',
  'atlas.mjs': 'new atlas\n',
  'tasty/browser.mjs': 'new browser\n',
}
const CURRENT = Object.keys(NEW)
const RETIRED = 'retired.mjs'
const dirs: string[] = []

afterEach(() => {
  for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})

function tempDir(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix))
  dirs.push(dir)
  return dir
}

function writeTree(root: string, files: Record<string, string>): void {
  for (const [rel, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true })
    fs.writeFileSync(path.join(root, rel), text)
  }
}

/** A dist holding the previous bundle, RETIRED included, and a stage holding the new one. */
function fixture(): { distDir: string; stageDir: string } {
  const distDir = tempDir('build-publish-dist-')
  const stageDir = tempDir('build-publish-stage-')
  writeTree(distDir, { ...OLD, [RETIRED]: 'retired\n' })
  writeTree(stageDir, NEW)
  return { distDir, stageDir }
}

/** What a reader of dist/ sees for each current output: its text, or 'missing'. */
function readerView(distDir: string): Record<string, string> {
  return Object.fromEntries(
    CURRENT.map(rel => {
      const file = path.join(distDir, rel)
      return [rel, fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : 'missing']
    }),
  )
}

describe('the bundle publish', () => {
  it('never shows a reader a missing output, at any step of the publish', async () => {
    const { distDir, stageDir } = fixture()
    const violations: string[] = []
    const sample = (label: string): void => {
      for (const [rel, view] of Object.entries(readerView(distDir))) {
        if (view !== OLD[rel] && view !== NEW[rel]) violations.push(`${label}: ${rel} reads as ${JSON.stringify(view)}`)
      }
    }
    sample('before the publish')
    await publishBundle({
      stageDir,
      distDir,
      outputs: CURRENT,
      previousOutputs: [...CURRENT, RETIRED],
      writeStamp: () => {
        sample('before the stamp')
        writeTree(distDir, { [BUNDLE_STAMP_FILE]: '{}\n' })
      },
      onStep: step => sample(`after ${step.type} ${step.rel ?? ''}`.trim()),
    })
    sample('after the publish')
    expect(violations).toEqual([])
    expect(readerView(distDir)).toEqual(NEW)
  })

  it('removes a retired output only after every replacement, and writes the stamp last', async () => {
    const { distDir, stageDir } = fixture()
    const steps: string[] = []
    await publishBundle({
      stageDir,
      distDir,
      outputs: CURRENT,
      previousOutputs: [...CURRENT, RETIRED],
      writeStamp: () => {
        steps.push('stamp written')
        writeTree(distDir, { [BUNDLE_STAMP_FILE]: '{}\n' })
      },
      onStep: step => steps.push(`${step.type} ${step.rel ?? ''}`.trim()),
    })
    expect(steps).toEqual([
      'replace index.mjs',
      'replace atlas.mjs',
      'replace tasty/browser.mjs',
      'remove retired.mjs',
      'stamp written',
      'stamp',
    ])
    expect(fs.existsSync(path.join(distDir, RETIRED))).toBe(false)
    expect(fs.existsSync(path.join(distDir, BUNDLE_STAMP_FILE))).toBe(true)
  })

  it('removes nothing and writes no stamp when a replacement fails part way', async () => {
    const { distDir, stageDir } = fixture()
    await expect(
      publishBundle({
        stageDir,
        distDir,
        outputs: [...CURRENT, 'not-staged.mjs'],
        previousOutputs: [...CURRENT, RETIRED],
        writeStamp: () => {
          throw new Error('the stamp must not be written after a failed replacement')
        },
      }),
    ).rejects.toThrow(/ENOENT/)
    expect(fs.existsSync(path.join(distDir, RETIRED))).toBe(true)
    expect(fs.existsSync(path.join(distDir, BUNDLE_STAMP_FILE))).toBe(false)
    expect(readerView(distDir)).toEqual(NEW)
  })
})
