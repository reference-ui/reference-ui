/**
 * Atom-count independence station (ATM-SEAM-07). The runtime artifact is a
 * function of the system, never of the atoms: compiling the fixture plus a
 * file of 500 distinct harvestable hexes and one color hole grows the sheet
 * by 500 rules while the runtime bytes stay identical. The sheet count is
 * asserted first so a vacuous plus-compile fails loud instead of passing.
 */
import fs from 'node:fs'
import path from 'node:path'
import { expect } from 'vitest'
import { compile } from '../../../js/index.js'
import { LIB_SYSTEM_SPEC, type AtomicCaseSpec } from '../../helpers.js'

const HEXES = 500

function hexSource(): string {
  const lines = ["import { css } from '@reference-ui/react'", '']
  for (let i = 1; i <= HEXES; i += 1) {
    lines.push(`export const x${i} = css({ color: '#${i.toString(16).padStart(6, '0')}' })`)
  }
  lines.push('export const hole = css({ color: null })')
  return `${lines.join('\n')}\n`
}

function hexRuleCount(stylesheet: string): number {
  return stylesheet.match(/__c_\\#/g)?.length ?? 0
}

const spec: AtomicCaseSpec = {
  id: 'ATM-SEAM-07',
  async verify(result, context) {
    const srcDir = path.join(context.inputDir, 'src')
    const files = fs
      .readdirSync(srcDir)
      .filter(name => name.endsWith('.ts'))
      .sort()
      .map(name => ({
        path: `input/src/${name}`,
        content: fs.readFileSync(path.join(srcDir, name), 'utf8'),
      }))
    files.push({ path: 'input/src/plus.ts', content: hexSource() })
    const plus = await compile({ files, baseSystem: LIB_SYSTEM_SPEC })

    // Green half: the plus-compile really added 500 harvested hexes.
    const grown = hexRuleCount(plus.stylesheet) - hexRuleCount(result.stylesheet)
    expect(grown).toBe(HEXES)
    expect(plus.diagnostics).toEqual([])

    // Red half: the runtime bytes do not see the 500 atoms.
    expect(JSON.stringify(plus.runtime)).toBe(JSON.stringify(result.runtime))
    expect(plus.stylePlans.length - result.stylePlans.length).toBe(HEXES)
  },
}

export default spec
