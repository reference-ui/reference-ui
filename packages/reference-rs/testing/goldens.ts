/**
 * Golden snapshot management engine for Reference RS compiler suites.
 * Handles deterministic golden serialization, filesystem diffing, and intentional
 * baseline updates via CLI flags. Guarantees zero silent overwrites during
 * standard runs. Stylesheet goldens are grammar-checked before write so
 * `--update-goldens` cannot bless CSS that does not parse or match.
 */
import fs from 'node:fs'
import path from 'node:path'
import { expect } from 'vitest'
import { assertWritableCss } from './css.js'
import type { GoldenDefinition } from './types.js'

export interface GoldenDiffOptions {
  update: boolean
  normalizeText?: (content: string, fileName: string) => string
  allowedCssProblems?: readonly string[]
}

/**
 * Returns true if golden updates were requested via CLI argument or environment variable.
 */
export function isUpdateGoldensRequested(): boolean {
  return process.argv.includes('--update-goldens') || process.env.UPDATE_GOLDENS === '1'
}

/**
 * Asserts that actual compilation outputs match committed golden files, or
 * rewrites them when update is explicitly enabled. CSS files are validated
 * before any write; quarantined fragments may pass via allowedCssProblems.
 */
export function diffOrWriteGoldens<TResult>(
  outputDir: string,
  result: TResult,
  goldens: GoldenDefinition<TResult>[],
  options: GoldenDiffOptions
): void {
  if (options.update) {
    writeGoldens(outputDir, result, goldens, options)
    return
  }
  assertGoldens(outputDir, result, goldens, options)
}

function serializeGolden<TResult>(
  golden: GoldenDefinition<TResult>,
  result: TResult,
  normalizeText?: (content: string, fileName: string) => string
): string {
  const value = golden.extract(result)
  const serialized =
    golden.format === 'json' ? JSON.stringify(value ?? {}, null, 2) + '\n' : String(value ?? '')
  return normalizeText ? normalizeText(serialized, golden.fileName) : serialized
}

function writeGoldens<TResult>(
  outputDir: string,
  result: TResult,
  goldens: GoldenDefinition<TResult>[],
  options: GoldenDiffOptions
): void {
  const files = goldens.map(golden => ({
    fileName: golden.fileName,
    serialized: serializeGolden(golden, result, options.normalizeText),
  }))
  for (const file of files) {
    if (file.fileName.endsWith('.css')) {
      assertWritableCss(file.serialized, file.fileName, options.allowedCssProblems)
    }
  }
  fs.mkdirSync(outputDir, { recursive: true })
  for (const file of files) {
    fs.writeFileSync(path.join(outputDir, file.fileName), file.serialized, 'utf-8')
  }
}

function assertGoldens<TResult>(
  outputDir: string,
  result: TResult,
  goldens: GoldenDefinition<TResult>[],
  options: GoldenDiffOptions
): void {
  expect(
    fs.existsSync(outputDir),
    `Golden output directory missing: ${outputDir}. Run with '--update-goldens' to generate.`
  ).toBe(true)

  for (const golden of goldens) {
    const filePath = path.join(outputDir, golden.fileName)
    expect(fs.existsSync(filePath), `Missing golden artifact: ${golden.fileName}`).toBe(true)
    const actual = serializeGolden(golden, result, options.normalizeText)
    const expected = options.normalizeText
      ? options.normalizeText(fs.readFileSync(filePath, 'utf-8'), golden.fileName)
      : fs.readFileSync(filePath, 'utf-8')
    if (golden.format === 'json') {
      expect(JSON.parse(actual)).toEqual(JSON.parse(expected))
    } else {
      expect(actual).toBe(expected)
    }
  }
}
