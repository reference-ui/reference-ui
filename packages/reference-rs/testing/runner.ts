/**
 * Generic station test runner for Reference RS compiler harnesses.
 * Replaces boilerplate case loops and eager pre-runners with declarative suites.
 * Discovers case stations, validates filesystem hygiene, executes semantic specs,
 * runs invariant standing gauges, and verifies committed output goldens.
 */
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import { diffOrWriteGoldens, isUpdateGoldensRequested } from './goldens.js'
import type { StationContext, StationSpec, StationSuiteConfig } from './types.js'

function discoverStations(casesDir: string, pattern: RegExp): string[] {
  if (!fs.existsSync(casesDir)) return []
  return fs
    .readdirSync(casesDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .filter(name => pattern.test(name))
    .sort()
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
    folderPattern = /^([A-Z]+-[A-Z]+-\d{2}|[a-zA-Z0-9_-]+)-.+$/,
    compile,
    goldens,
    standingGauges = [],
    requiredFiles = ['README.md', 'spec.ts', 'input'],
    normalizeText,
    allowedCssProblems,
  } = config

  const updateGoldens = isUpdateGoldensRequested()
  const stations = discoverStations(casesDir, folderPattern)

  describe(suiteName, () => {
    it(`discovers at least one station under ${path.basename(casesDir)}`, () => {
      expect(stations.length).toBeGreaterThan(0)
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
