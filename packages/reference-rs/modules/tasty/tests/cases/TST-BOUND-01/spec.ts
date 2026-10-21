/**
 * Case specification for TST-BOUND-01.
 * Projects every symbol's display members in a child process and requires the whole pass to finish inside 2 s.
 * Each cycle ends at the ancestor it revisits, so each named symbol lists a fixed, finite member set, and the API raises no notice.
 * Proves primary SPEC ID anchor TST-BOUND-01.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect } from 'vitest'
import { expectBounded, runIsolated, type StationSpec } from '../../../../../testing/index.js'
import type { TastyCaseResult } from '../../harness/helpers.js'

interface DisplaySymbol {
  id: string
  name: string
  members: string[]
}

interface DisplayReport {
  symbols: DisplaySymbol[]
  notices: string[]
}

const DRIVER = fileURLToPath(new URL('./display-every-symbol.mjs', import.meta.url))

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-BOUND-01',
  async verify({ runtimeDir }) {
    const run = runIsolated<DisplayReport>({
      module: DRIVER,
      fn: 'displayEverySymbol',
      args: [path.join(runtimeDir, 'manifest.js')],
      timeoutMs: 20_000,
    })
    const report = expectBounded(run, { ms: 2000 })

    const members = new Map(
      report.symbols.map(symbol => [symbol.name, [...symbol.members].sort()])
    )
    expect(members.get('I')).toEqual(['a', 'i'])
    expect(members.get('A')).toEqual(['a', 'i'])
    expect(members.get('GI')).toEqual(['a', 'i'])
    expect(members.get('GA')).toEqual(['a', 'i'])
    expect(members.get('GU')).toEqual(['a', 'i'])
    expect(members.get('G')).toEqual(['g', 'h'])
    expect(members.get('H')).toEqual(['g', 'h'])
    expect(members.get('U')).toEqual(['g', 'h'])
    expect(members.get('Box')).toEqual(['v'])
    expect(report.notices).toEqual([])
  },
}

export default spec
