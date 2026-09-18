// Unit tests for the Neo globalCss() collector plus the JSON seam contract.
// They take global rule maps and assert verbatim collection and strip behavior.
// The JSON round-trip pins why no host-side undefined strip exists: the native
// compile seam stringifies the spec, so undefined keys never reach the engine.
import { describe, expect, it } from 'vitest'
import { createGlobalCssCollector, globalCss, type GlobalCssConfig } from './globalCss.ts'

const globalCssCollector = createGlobalCssCollector()

describe('globalCss() with globalCss collector', () => {
  it('has correct collector config', () => {
    expect(globalCssCollector.config.name).toBe('globalCss')
    expect(globalCssCollector.config.targetFunction).toBe('globalCss')
  })

  it('collects rules verbatim, keeping undefined keys in memory', () => {
    globalCssCollector.init()
    try {
      globalCss({
        '.ref-input': {
          display: 'inline-flex',
          width: '100%',
        },
      })
      globalCss({
        '.ref-input': {
          display: undefined,
          width: '100%',
        },
      })

      const result = globalCssCollector.getFragments()
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({ '.ref-input': { display: 'inline-flex', width: '100%' } })
      expect(result[1]).toEqual({ '.ref-input': { display: undefined, width: '100%' } })
      expect('display' in result[1]['.ref-input']).toBe(true)
    } finally {
      globalCssCollector.cleanup()
    }
  })

  it('drops undefined keys across the JSON seam the compiler reads', () => {
    const rules: GlobalCssConfig = {
      '.ref-input': {
        ...{ display: 'inline-flex', alignItems: 'center' },
        display: undefined,
        alignItems: undefined,
        width: '100%',
      },
    }
    const revived = JSON.parse(JSON.stringify(rules)) as GlobalCssConfig
    expect(revived).toEqual({ '.ref-input': { width: '100%' } })
  })
})
