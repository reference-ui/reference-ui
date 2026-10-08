/**
 * CSS quarantine meta-tests and golden-writer guard.
 * Reads committed station goldens, not live compile output: an entry that now
 * parses must be removed from the list. Also proves `--update-goldens` will
 * refuse a stylesheet that fails validation outside the quarantine, which is
 * how every current defect originally entered the repo.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  assertWritableCss,
  staleCssAllowlist,
  validateCss,
} from '../../../testing/css.js'
import { diffOrWriteGoldens } from '../../../testing/goldens.js'
import { CASES_DIR } from './helpers.js'
import { CSS_QUARANTINE } from './css-quarantine.js'

describe('css quarantine', () => {
  it('contains no entry that now validates', () => {
    for (const [stationId, entries] of Object.entries(CSS_QUARANTINE)) {
      const cssPath = path.join(CASES_DIR, stationId, 'output', 'styles.css')
      expect(fs.existsSync(cssPath), `missing golden stylesheet for ${stationId}`).toBe(
        true
      )
      const problems = validateCss(fs.readFileSync(cssPath, 'utf8'))
      expect(
        staleCssAllowlist(problems, entries),
        `${stationId} quarantine entries now validate; remove them from CSS_QUARANTINE`
      ).toEqual([])
    }
  })

  it('golden writer refuses CSS that fails validation outside the quarantine', () => {
    const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'atomic-css-guard-'))
    const goldens = [
      {
        fileName: 'styles.css',
        format: 'text' as const,
        extract: (result: { stylesheet: string }) => result.stylesheet,
      },
    ]

    expect(() =>
      diffOrWriteGoldens(outputDir, { stylesheet: '.x { color: n300; }' }, goldens, {
        update: true,
      })
    ).toThrow(/Refusing to write styles.css/)
    expect(fs.existsSync(path.join(outputDir, 'styles.css'))).toBe(false)

    diffOrWriteGoldens(outputDir, { stylesheet: '.x { color: n300; }' }, goldens, {
      update: true,
      allowedCssProblems: ['color: n300'],
    })
    expect(fs.readFileSync(path.join(outputDir, 'styles.css'), 'utf8')).toContain(
      'color: n300'
    )

    expect(() => assertWritableCss('.x { color: red; }', 'styles.css')).not.toThrow()
  })
})
