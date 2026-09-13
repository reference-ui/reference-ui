/**
 * Golden fixture verification suite for standalone reference-system compilation cases.
 * Discovers and validates all test cases under `tests/system/cases/` against committed goldens.
 * Guarantees regression protection across AST extraction, condition resolution, and stylesheet emission.
 */
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { CASES_DIR, compileFixture, getCaseDir, getCaseInputDir } from './helpers.js'

describe('system standalone golden cases', () => {
  const caseEntries = fs.readdirSync(CASES_DIR, { withFileTypes: true })
  const caseNames = caseEntries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()

  for (const caseName of caseNames) {
    describe(`case: ${caseName}`, () => {
      const caseDir = getCaseDir(caseName)
      const inputDir = getCaseInputDir(caseName)
      const outputDir = path.join(caseDir, 'output')

      it('matches golden stylesheet, runtime metadata, and diagnostics', async () => {
        const result = await compileFixture(inputDir)

        const expectedStylesPath = path.join(outputDir, 'styles.css')
        const expectedCssPath = path.join(outputDir, 'css.json')
        const expectedDiagPath = path.join(outputDir, 'diagnostics.json')

        expect(fs.existsSync(expectedStylesPath)).toBe(true)
        const expectedStyles = fs.readFileSync(expectedStylesPath, 'utf-8')
        expect(result.stylesheet).toBe(expectedStyles)

        if (fs.existsSync(expectedCssPath)) {
          const expectedCss = JSON.parse(fs.readFileSync(expectedCssPath, 'utf-8'))
          expect(result.css?.classes ?? {}).toEqual(expectedCss)
        }

        if (fs.existsSync(expectedDiagPath)) {
          const expectedDiag = JSON.parse(fs.readFileSync(expectedDiagPath, 'utf-8'))
          expect(result.diagnostics ?? []).toEqual(expectedDiag)
        }
      })
    })
  }
})
