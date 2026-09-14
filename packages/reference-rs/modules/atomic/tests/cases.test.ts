/**
 * Atomic case executor. Discovers tests/cases, compiles each input tree, runs
 * the spec, then diffs committed output goldens. Standing gauges fire on every
 * station: six-layer preamble and zero ghost classes. `--update-goldens` rewrites
 * styles.css, css.json, and diagnostics.json; it does not invent a spec.
 */
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  CASES_DIR,
  LAYER_PREAMBLE,
  classSelector,
  compileCase,
  getCaseDir,
  getCaseOutputDir,
  parseCaseFolder,
  type AtomicCaseSpec,
  type CompileResult,
} from './helpers.js'

const updateGoldens =
  process.argv.includes('--update-goldens') || process.env.UPDATE_GOLDENS === '1'

function listCaseNames(): string[] {
  if (!fs.existsSync(CASES_DIR)) return []
  return fs
    .readdirSync(CASES_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .filter(name => parseCaseFolder(name) !== null)
    .sort()
}

function requireCaseFiles(caseName: string): { specPath: string; outputDir: string } {
  const caseDir = getCaseDir(caseName)
  const specPath = path.join(caseDir, 'spec.ts')
  expect(fs.existsSync(path.join(caseDir, 'README.md'))).toBe(true)
  expect(fs.existsSync(specPath)).toBe(true)
  expect(fs.existsSync(path.join(caseDir, 'input'))).toBe(true)
  return { specPath, outputDir: getCaseOutputDir(caseName) }
}

async function loadSpec(specPath: string, expectedId: string): Promise<AtomicCaseSpec> {
  const specModule = await import(specPath)
  const spec = specModule.default as AtomicCaseSpec
  expect(spec?.id).toBe(expectedId)
  expect(typeof spec.verify).toBe('function')
  return spec
}

function assertStandingGauges(result: CompileResult): void {
  expect(result.stylesheet.startsWith(LAYER_PREAMBLE)).toBe(true)
  for (const className of Object.values(result.css.classes ?? {})) {
    expect(result.stylesheet).toContain(classSelector(className))
  }
}

function writeGoldens(outputDir: string, result: CompileResult): void {
  fs.mkdirSync(outputDir, { recursive: true })
  fs.writeFileSync(path.join(outputDir, 'styles.css'), result.stylesheet || '', 'utf-8')
  fs.writeFileSync(
    path.join(outputDir, 'css.json'),
    JSON.stringify(result.css?.classes ?? {}, null, 2) + '\n',
    'utf-8'
  )
  fs.writeFileSync(
    path.join(outputDir, 'diagnostics.json'),
    JSON.stringify(result.diagnostics ?? [], null, 2) + '\n',
    'utf-8'
  )
}

function assertGoldens(outputDir: string, result: CompileResult): void {
  const expectedStyles = fs.readFileSync(path.join(outputDir, 'styles.css'), 'utf-8')
  expect(result.stylesheet || '').toBe(expectedStyles)
  const expectedCss = JSON.parse(
    fs.readFileSync(path.join(outputDir, 'css.json'), 'utf-8')
  )
  expect(result.css?.classes ?? {}).toEqual(expectedCss)
  const expectedDiag = JSON.parse(
    fs.readFileSync(path.join(outputDir, 'diagnostics.json'), 'utf-8')
  )
  expect(result.diagnostics ?? []).toEqual(expectedDiag)
}

describe('atomic cases', () => {
  const caseNames = listCaseNames()

  it('ATM-GHOST-01 ATM-LAYER-01 discovers at least one case station', () => {
    expect(caseNames.length).toBeGreaterThan(0)
  })

  for (const caseName of caseNames) {
    describe(caseName, () => {
      it(`${caseName} compiles, verifies, and matches output goldens`, async () => {
        const expectedId = parseCaseFolder(caseName)
        expect(expectedId).toBeTruthy()
        const { specPath, outputDir } = requireCaseFiles(caseName)
        const spec = await loadSpec(specPath, expectedId!)
        const result = await compileCase(caseName)
        await spec.verify(result)
        assertStandingGauges(result)
        if (updateGoldens) {
          writeGoldens(outputDir, result)
        } else {
          expect(fs.existsSync(outputDir)).toBe(true)
          assertGoldens(outputDir, result)
        }
      })
    })
  }
})
