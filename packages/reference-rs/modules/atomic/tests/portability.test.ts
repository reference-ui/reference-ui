/**
 * Golden portability meta-tests (ATM-FORBID-07). No committed station
 * output file may contain machine-specific state: absolute paths, home
 * directories, or hostnames. Diagnostics `file` fields must be
 * case-relative so the suite passes on any checkout, not just the laptop
 * that wrote the goldens.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { CASES_DIR, CASE_FOLDER } from './helpers.js'

const MACHINE_MARKERS = [os.homedir(), '/Users/', '/home/', os.hostname()].filter(
  marker => marker.length > 1
)

function outputFiles(): string[] {
  const files: string[] = []
  for (const entry of fs.readdirSync(CASES_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory() || !CASE_FOLDER.test(entry.name)) {
      continue
    }
    const outputDir = path.join(CASES_DIR, entry.name, 'output')
    if (!fs.existsSync(outputDir)) {
      continue
    }
    for (const file of fs.readdirSync(outputDir)) {
      files.push(path.join(outputDir, file))
    }
  }
  return files.sort()
}

describe('golden portability', () => {
  it('commits no machine-specific state in station outputs', () => {
    const files = outputFiles()
    expect(files.length).toBeGreaterThan(0)
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8')
      for (const marker of MACHINE_MARKERS) {
        expect(
          content.includes(marker),
          `${file} embeds machine-specific marker ${JSON.stringify(marker)}`
        ).toBe(false)
      }
    }
  })

  it('keeps diagnostics file fields case-relative', () => {
    for (const file of outputFiles()) {
      if (path.basename(file) !== 'diagnostics.json') {
        continue
      }
      const diagnostics = JSON.parse(fs.readFileSync(file, 'utf8')) as Array<{
        file?: unknown
      }>
      for (const diagnostic of diagnostics) {
        if (typeof diagnostic.file !== 'string') {
          continue
        }
        expect(
          path.isAbsolute(diagnostic.file),
          `${file} has absolute diagnostics path ${diagnostic.file}`
        ).toBe(false)
      }
    }
  })
})
