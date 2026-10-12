/**
 * TYP-TONE-07–09 tsc consumers for toned colour tokens.
 * The tones golden declares colour `blue.500` plus tones `medium` / `hush`, so
 * `ToneToken` joins `ColorToken` in `TonedColorToken`. Strict colors reject a
 * misspelled tone (`blue.500/mediun`); open emit lets it through on the
 * `(string & {})` hatch.
 */

import { describe, it } from 'vitest'
import { compile, expectTscOk, expectTscReject, readGolden } from './tsc'

describe('TYP-TONE tsc consumers', () => {
  const openDts = readGolden('tones.d.ts')
  const strictDts = readGolden('tones-strict.d.ts')

  it('TYP-TONE-07 toned colour typechecks under strict colors', () => {
    expectTscOk(
      compile({
        dts: strictDts,
        source: `import type { SystemStyleObject } from './styles'

export const ok: SystemStyleObject = { bg: 'blue.500/medium' }
`,
      })
    )
  })

  it('TYP-TONE-08 misspelled tone is a type error under strict colors', () => {
    expectTscReject(
      compile({
        dts: strictDts,
        source: `import type { SystemStyleObject } from './styles'

export const bad: SystemStyleObject = { bg: 'blue.500/mediun' }
`,
      }),
      /TS(2322|2820)/
    )
  })

  it('TYP-TONE-09 open emit lets toned and arbitrary colours through', () => {
    for (const bg of ['blue.500/medium', 'blue.500/mediun']) {
      expectTscOk(
        compile({
          dts: openDts,
          source: `import type { SystemStyleObject } from './styles'

export const ok: SystemStyleObject = { bg: '${bg}' }
`,
        })
      )
    }
  })
})
