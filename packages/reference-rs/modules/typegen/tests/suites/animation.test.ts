/**
 * TYP-TOKEN-07 tsc consumers over the live emitter. A dump carrying animations
 * tokens prints `AnimationToken` with every token path, and the `animation`
 * shorthand accepts either a token path or a raw shorthand string. `animationName`
 * stays open because keyframe names are not tokens. The probe runs through the
 * same tsc harness as the golden suites, so a printer change fails the typecheck.
 */

import { describe, expect, it } from 'vitest'
import { emitDtsSync } from '../../js/index.js'
import type { EvaluatedSystemSpec } from '../../js/types.js'
import { compile, expectTscOk } from '../harness/tsc'

function spec(overrides: Partial<EvaluatedSystemSpec> = {}): EvaluatedSystemSpec {
  return {
    schemaVersion: 1,
    profile: 'reference-ui',
    name: 'tgn-animation',
    tokens: {},
    fonts: {},
    globalCss: [],
    keyframes: {},
    recipes: {},
    staticCss: {},
    provenance: [],
    ...overrides,
  }
}

const animated = spec({
  tokens: {
    animations: {
      spin: { slow: { value: 'spin 4s linear infinite' } },
      fadeIn: { quick: { value: 'fadeIn 0.2s ease-out' } },
    },
  },
  breakpoints: { sm: '640px' },
})

describe('TYP-TOKEN-07 animation tsc consumers', () => {
  const dts = emitDtsSync({ baseSystem: animated })

  it('TYP-TOKEN-07 AnimationToken names every animations token path', () => {
    expect(dts).toContain("export type AnimationToken = 'fadeIn.quick' | 'spin.slow';")
  })

  it('TYP-TOKEN-07 token path and raw shorthand typecheck on animation', () => {
    expectTscOk(
      compile({
        dts,
        source: `import type { SystemStyleObject } from './styles'

export const token: SystemStyleObject = { animation: 'spin.slow' }
export const raw: SystemStyleObject = { animation: 'spin 1s linear infinite' }
export const named: SystemStyleObject = { animationName: 'fadeIn' }
`,
      })
    )
  })
})
