/**
 * Golden fixture verification suite for standalone reference-system compilation cases.
 * Validates style contracts (spec.ts) and committed snapshots (output/*).
 */
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { FIXTURES_DIR, compileFixture, getFixtureDir, getFixtureInputDir } from './helpers.js'
import type { CompileResult } from '../js/types.js'

describe('system standalone golden fixtures', () => {
  const fixtureEntries = fs.existsSync(FIXTURES_DIR) ? fs.readdirSync(FIXTURES_DIR, { withFileTypes: true }) : []
  const fixtureNames = fixtureEntries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()

  const updateGoldens = process.argv.includes('--update-goldens')

  for (const fixtureName of fixtureNames) {
    describe(`fixture: ${fixtureName}`, () => {
      const fixtureDir = getFixtureDir(fixtureName)
      const inputDir = getFixtureInputDir(fixtureName)
      const outputDir = path.join(fixtureDir, 'output')
      const specPathTs = path.join(fixtureDir, 'spec.ts')
      const specPathJs = path.join(fixtureDir, 'spec.js')

      it('compiles, validates invariants, and matches snapshots', async () => {
        const result = await compileFixture(inputDir)

        const expectedStylesPath = path.join(outputDir, 'styles.css')
        const expectedCssPath = path.join(outputDir, 'css.json')
        const expectedDiagPath = path.join(outputDir, 'diagnostics.json')
        const expectedWantsPath = path.join(outputDir, 'wants.json')

        // 1. Run spec invariants FIRST (if they exist)
        let specFile = fs.existsSync(specPathTs) ? specPathTs : fs.existsSync(specPathJs) ? specPathJs : null
        if (specFile) {
          // Dynamic import, assuming it exports a default function
          const specModule = await import(specFile)
          if (typeof specModule.default === 'function') {
            await specModule.default(result)
          } else if (typeof specModule.verify === 'function') {
            await specModule.verify(result)
          }
        }

        // 2. Output snapshots (update or assert)
        if (updateGoldens) {
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true })
          }
          fs.writeFileSync(expectedStylesPath, result.stylesheet || '', 'utf-8')
          fs.writeFileSync(expectedCssPath, JSON.stringify(result.css?.classes ?? {}, null, 2) + '\n', 'utf-8')
          fs.writeFileSync(expectedDiagPath, JSON.stringify(result.diagnostics ?? [], null, 2) + '\n', 'utf-8')
          if (result.wants && result.wants.length > 0) {
            fs.writeFileSync(expectedWantsPath, JSON.stringify(result.wants, null, 2) + '\n', 'utf-8')
          } else if (fs.existsSync(expectedWantsPath)) {
            fs.unlinkSync(expectedWantsPath)
          }
        } else {
          // Verify
          expect(fs.existsSync(expectedStylesPath)).toBe(true)
          const expectedStyles = fs.readFileSync(expectedStylesPath, 'utf-8')
          expect(result.stylesheet || '').toBe(expectedStyles)

          expect(fs.existsSync(expectedCssPath)).toBe(true)
          const expectedCss = JSON.parse(fs.readFileSync(expectedCssPath, 'utf-8'))
          expect(result.css?.classes ?? {}).toEqual(expectedCss)

          expect(fs.existsSync(expectedDiagPath)).toBe(true)
          const expectedDiag = JSON.parse(fs.readFileSync(expectedDiagPath, 'utf-8'))
          expect(result.diagnostics ?? []).toEqual(expectedDiag)

          if (fs.existsSync(expectedWantsPath)) {
            const expectedWants = JSON.parse(fs.readFileSync(expectedWantsPath, 'utf-8'))
            expect(result.wants ?? []).toEqual(expectedWants)
          }
        }
      })
    })
  }
})
