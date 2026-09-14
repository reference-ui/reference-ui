/**
 * Golden snapshot management engine for Reference RS compiler suites.
 * Handles deterministic golden serialization, filesystem diffing, and intentional
 * baseline updates via CLI flags. Guarantees zero silent overwrites during standard runs.
 */
import fs from 'node:fs'
import path from 'node:path'
import { expect } from 'vitest'
import type { GoldenDefinition } from './types.js'

/**
 * Returns true if golden updates were requested via CLI argument or environment variable.
 */
export function isUpdateGoldensRequested(): boolean {
  return process.argv.includes('--update-goldens') || process.env.UPDATE_GOLDENS === '1'
}

/**
 * Asserts that actual compilation outputs match committed golden files, or
 * rewrites them when update is explicitly enabled.
 */
export function diffOrWriteGoldens<TResult>(
  outputDir: string,
  result: TResult,
  goldens: GoldenDefinition<TResult>[],
  update: boolean,
  normalizeText?: (content: string, fileName: string) => string
): void {
  if (update) {
    fs.mkdirSync(outputDir, { recursive: true })
    for (const g of goldens) {
      const filePath = path.join(outputDir, g.fileName)
      const value = g.extract(result)
      const serialized =
        g.format === 'json'
          ? JSON.stringify(value ?? {}, null, 2) + '\n'
          : String(value ?? '')
      fs.writeFileSync(filePath, serialized, 'utf-8')
    }
    return
  }

  expect(
    fs.existsSync(outputDir),
    `Golden output directory missing: ${outputDir}. Run with '--update-goldens' to generate.`
  ).toBe(true)

  for (const g of goldens) {
    const filePath = path.join(outputDir, g.fileName)
    expect(fs.existsSync(filePath), `Missing golden artifact: ${g.fileName}`).toBe(true)
    const raw = fs.readFileSync(filePath, 'utf-8')

    if (g.format === 'json') {
      const actual = g.extract(result) ?? {}
      const expected = JSON.parse(raw)
      expect(actual).toEqual(expected)
    } else {
      let actual = String(g.extract(result) ?? '')
      let expected = raw
      if (normalizeText) {
        actual = normalizeText(actual, g.fileName)
        expected = normalizeText(expected, g.fileName)
      }
      expect(actual).toBe(expected)
    }
  }
}
