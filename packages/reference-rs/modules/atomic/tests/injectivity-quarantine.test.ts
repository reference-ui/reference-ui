/**
 * Injectivity quarantine meta-tests, ghost-gauge failure proof, and a
 * two-file reverse-file ORDER-06 check. Reads committed css.json goldens: a
 * listed station whose class names are now unique must leave
 * INJECTIVITY_QUARANTINE. A bogus extra ID fails the same way. Ghost membership
 * is css-tree class selectors inside `@layer utilities`, not a TypeScript escaper.
 */
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  CASES_DIR,
  LAYER_PREAMBLE,
  compileCase,
  layerClassNames,
  noGhostClasses,
  type CompileResult,
} from './helpers.js'
import { INJECTIVITY_QUARANTINE } from './injectivity-quarantine.js'
import type { StationContext } from '../../../testing/index.js'

describe('injectivity quarantine', () => {
  it('contains no station that now has unique class names', () => {
    for (const stationId of INJECTIVITY_QUARANTINE) {
      expect(
        classNamesCollide(stationId),
        `${stationId} class names are unique; remove it from INJECTIVITY_QUARANTINE`
      ).toBe(true)
    }
  })
})

describe('input order', () => {
  it('ATM-ATOM-03 reversed files emit the same stylesheet', async () => {
    const forward = await compileCase('ATM-ATOM-03')
    const a = path.join(CASES_DIR, 'ATM-ATOM-03', 'input', 'src', 'a.tsx')
    const b = path.join(CASES_DIR, 'ATM-ATOM-03', 'input', 'src', 'b.tsx')
    const reversed = await compileCase('ATM-ATOM-03', {
      files: [
        { path: b, content: fs.readFileSync(b, 'utf8') },
        { path: a, content: fs.readFileSync(a, 'utf8') },
      ],
    })
    expect(reversed.stylesheet).toBe(forward.stylesheet)
    expect(reversed.css.classes).toEqual(forward.css.classes)
    expect(reversed.diagnostics).toEqual(forward.diagnostics)
  })
})

describe('ghost gauge', () => {
  it('fails when a runtime class is missing from @layer utilities', () => {
    const result: CompileResult = {
      stylesheet: `${LAYER_PREAMBLE}\n@layer utilities {\n  .mt_2r { margin-top: 1px; }\n}\n`,
      css: { classes: { 'mt:2r': 'mt_2r', 'color:red': 'c_red' } },
      diagnostics: [],
    }
    expect(() => noGhostClasses(result, gaugeContext('ATM-PROBE'))).toThrow(
      /ATM-GHOST-01 ATM-PROBE: runtime class\(es\) missing from @layer utilities: c_red/
    )
  })

  it('collects recipe-layer class names without a TypeScript escaper', () => {
    const sheet = `${LAYER_PREAMBLE}\n@layer recipes {\n  .button { font-weight: bold; }\n}\n@layer utilities {\n  .mt_2r { margin-top: 1px; }\n}\n`
    expect(layerClassNames(sheet, 'recipes').has('button')).toBe(true)
    expect(layerClassNames(sheet, 'utilities').has('button')).toBe(false)
    expect(layerClassNames(sheet, 'utilities').has('mt_2r')).toBe(true)
  })
})

function classNamesCollide(stationId: string): boolean {
  const cssPath = path.join(CASES_DIR, stationId, 'output', 'css.json')
  expect(fs.existsSync(cssPath), `missing css.json for ${stationId}`).toBe(true)
  const classes = Object.values(
    JSON.parse(fs.readFileSync(cssPath, 'utf8')) as Record<string, string>
  )
  return new Set(classes).size !== classes.length
}

function gaugeContext(caseId: string): StationContext {
  return {
    caseName: caseId,
    caseId,
    caseDir: '',
    inputDir: '',
    outputDir: '',
  }
}
