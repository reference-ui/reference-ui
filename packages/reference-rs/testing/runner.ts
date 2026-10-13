/**
 * Generic station test runner for Reference RS compiler harnesses.
 * Replaces boilerplate case loops and eager pre-runners with declarative suites.
 * Discovers case stations, rejects folders under cases/ that are not raw case IDs,
 * validates filesystem hygiene and each case's index and README heading, executes
 * semantic specs, runs invariant standing gauges, and verifies committed output goldens.
 */
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  caseIndexProblems,
  readCaseIndex,
  readCaseReadme,
  readmeProblems,
  strayCaseFolders,
} from './caseIndex.js'
import { diffOrWriteGoldens, isUpdateGoldensRequested } from './goldens.js'
import type { StationContext, StationSpec, StationSuiteConfig } from './types.js'

/** Every directory directly under a cases/ folder, sorted by name. */
function listCaseFolders(casesDir: string): string[] {
  if (!fs.existsSync(casesDir)) return []
  return fs
    .readdirSync(casesDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort()
}

function discoverStations(casesDir: string, pattern: RegExp): string[] {
  return listCaseFolders(casesDir).filter(name => pattern.test(name))
}

function checkHygiene(stationDir: string, stationName: string, requiredFiles: string[]): void {
  for (const req of requiredFiles) {
    const assetPath = path.join(stationDir, req)
    expect(
      fs.existsSync(assetPath),
      `Missing required station asset '${req}' in ${stationName}`
    ).toBe(true)
  }
}

async function loadSpec<TResult>(
  specPath: string,
  expectedId: string
): Promise<StationSpec<TResult>> {
  const specUrl = pathToFileURL(specPath).href
  const specModule = await import(specUrl)
  const spec = (specModule.default ?? specModule) as StationSpec<TResult>
  expect(
    spec?.id,
    `spec.id '${spec?.id}' must match station prefix '${expectedId}'`
  ).toBe(expectedId)
  expect(typeof spec?.verify, 'spec.verify must be an executable function').toBe('function')
  return spec
}

/**
 * Creates a declarative Vitest test suite over a station directory.
 */
export function createStationSuite<TResult>(config: StationSuiteConfig<TResult>): void {
  const {
    suiteName,
    casesDir,
    // Default: folder name is the raw station id (ATL-BAR-01); modules pass their own.
    folderPattern = /^([A-Z]+-[A-Z]+-\d{2})$/,
    compile,
    goldens,
    standingGauges = [],
    requiredFiles = ['README.md', 'spec.ts', 'input'],
    normalizeText,
    allowedCssProblems,
  } = config

  const updateGoldens = isUpdateGoldensRequested()
  const stations = discoverStations(casesDir, folderPattern)
  const strays = strayCaseFolders(listCaseFolders(casesDir), folderPattern)
  const casesLabel = path.basename(casesDir)

  describe(suiteName, () => {
    it(`discovers at least one station under ${casesLabel}`, () => {
      expect(stations.length).toBeGreaterThan(0)
    })

    it(`every folder under ${casesLabel}/ is named by a raw case ID`, () => {
      expect(
        strays,
        `${casesLabel}/ holds folders not named by a raw case ID ${folderPattern}: ${strays.join(', ')}`
      ).toEqual([])
    })

    for (const stationName of stations) {
      describe(stationName, () => {
        it(`${stationName} compiles, passes gauges, and matches goldens`, async () => {
          const match = folderPattern.exec(stationName)
          const expectedId = match ? match[1]! : stationName
          const stationDir = path.join(casesDir, stationName)
          const context: StationContext = {
            caseName: stationName,
            caseId: expectedId,
            caseDir: stationDir,
            inputDir: path.join(stationDir, 'input'),
            outputDir: path.join(stationDir, 'output'),
          }

          checkHygiene(stationDir, stationName, requiredFiles)
          const caseProblems = [
            ...caseIndexProblems(stationName, readCaseIndex(stationDir)),
            ...readmeProblems(stationName, readCaseReadme(stationDir)),
          ]
          expect(
            caseProblems,
            `${stationName}: case folder breaks the case convention`
          ).toEqual([])

          const spec = await loadSpec<TResult>(
            path.join(stationDir, 'spec.ts'),
            expectedId
          )
          const result = await compile(context)

          await spec.verify(result, context)

          for (const gauge of standingGauges) {
            await gauge(result, context)
          }

          diffOrWriteGoldens(context.outputDir, result, goldens, {
            update: updateGoldens,
            normalizeText: normalizeText
              ? (content, fileName) => normalizeText(content, fileName, context)
              : undefined,
            allowedCssProblems: allowedCssProblems?.(context),
          })
        })
      })
    }
  })
}
