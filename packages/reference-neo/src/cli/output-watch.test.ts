// Unit tests for the watch stall and failure output: the stuck line a save prints behind a stuck pass, the exit line
// a shutdown prints when it gives a sync up, and the JSON row a failed sync event prints. They pin the strings and
// the one-row array shape a --json watch writes on stdout.

import { describe, expect, it } from 'vitest'
import { formatJsonDiagnostics } from '../diagnostics/index.ts'
import { formatStuckSyncLine, syncFailureEntry, UNSETTLED_SYNC_LINE } from './output.ts'

describe('watch stall lines', () => {
  it('pins the exit line a shutdown prints when the in-flight sync does not settle', () => {
    expect(UNSETTLED_SYNC_LINE).toBe('[ref] watch: in-flight sync did not settle; exiting')
  })

  it('reports a stuck pass in one line, counted in whole seconds', () => {
    expect(formatStuckSyncLine(5000)).toBe(
      '[ref] watch: in-flight sync stuck for 5 s; this save waits until it settles',
    )
    expect(formatStuckSyncLine(7999)).toBe(
      '[ref] watch: in-flight sync stuck for 7 s; this save waits until it settles',
    )
  })
})

describe('failed sync event rows', () => {
  it('is a codeless error row that prints as a one-row diagnostics array', () => {
    expect(formatJsonDiagnostics([syncFailureEntry('json-boom')])).toBe('[{"severity":"error","message":"json-boom"}]')
  })
})
