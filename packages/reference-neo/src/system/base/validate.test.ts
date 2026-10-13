// Unit tests for the base-system extends and layers validation.
// They take candidate extends and layers entries and assert accept or typed rejection.
// The entries ride validateConfig end to end, so the config-to-base arrow
// stays proven alongside the branch behavior.

import { describe, expect, it } from 'vitest'
import { validateConfig } from '../../config/validate.ts'

const SYSTEM_NAME = 'my-system'
const DEFAULT_INCLUDE = ['src/**/*.{ts,tsx}']
const FRAGMENT_CODE = 'fragment-code'
const STREAMS = [{ name: 'tokens', preamble: '@layer reset, global, base, tokens, recipes, utilities;\n' }]

describe('validateConfig extends', () => {
  it('requires extends to be an array of named systems with synced payloads', () => {
    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        extends: {} as never,
      })
    ).toThrowError(/field 'extends' is invalid/i)

    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        extends: [{} as never],
      })
    ).toThrowError(/must have a non-empty 'name'/i)

    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        extends: [{ name: 'upstream' } as never],
      })
    ).toThrowError(/must include synced system data/i)
  })

  it('accepts extends entries that only contribute streams or jsx elements', () => {
    const config = validateConfig({
      name: SYSTEM_NAME,
      include: DEFAULT_INCLUDE,
      extends: [
        { name: 'icons', fragment: '', jsxElements: ['HomeIcon'] },
        { name: 'tokens', fragment: '', streams: STREAMS },
      ],
    })

    expect(config.extends).toEqual([
      { name: 'icons', fragment: '', jsxElements: ['HomeIcon'] },
      { name: 'tokens', fragment: '', streams: STREAMS },
    ])
  })

  it('rejects extends entries whose streams array is empty', () => {
    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        extends: [{ name: 'tokens', fragment: '', streams: [] }],
      })
    ).toThrowError(/must include synced system data/i)
  })

  it('accepts valid extends entries', () => {
    const config = validateConfig({
      name: SYSTEM_NAME,
      include: DEFAULT_INCLUDE,
      extends: [{ name: 'base', fragment: FRAGMENT_CODE, jsxElements: ['IconShell'] }],
    })

    expect(config.extends).toEqual([{ name: 'base', fragment: FRAGMENT_CODE, jsxElements: ['IconShell'] }])
  })

  it('rejects invalid base-system jsxElements shapes', () => {
    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        extends: [{ name: 'base', fragment: FRAGMENT_CODE, jsxElements: 'IconShell' } as never],
      })
    ).toThrowError(/jsxElements/i)
  })
})

describe('validateConfig layers', () => {
  it('requires layers to be an array of named systems with synced payloads', () => {
    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        layers: {} as never,
      })
    ).toThrowError(/field 'layers' is invalid/i)

    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        layers: [{ name: 'upstream' } as never],
      })
    ).toThrowError(/must include synced system data/i)

    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        layers: [{ name: 'tokens', fragment: '', streams: [] }],
      })
    ).toThrowError(/must include synced system data/i)
  })

  it('accepts layers entries that only contribute streams', () => {
    const config = validateConfig({
      name: SYSTEM_NAME,
      include: DEFAULT_INCLUDE,
      layers: [{ name: 'tokens', fragment: '', streams: STREAMS }],
    })

    expect(config.layers).toEqual([{ name: 'tokens', fragment: '', streams: STREAMS }])
  })
})

describe('validateConfig extends edges', () => {
  it('rejects non-object extends entries', () => {
    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        extends: [null],
      })
    ).toThrowError(/entry 0 must be an object/i)
  })

  it('rejects whitespace-only extends names', () => {
    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        extends: [{ name: '   ', fragment: FRAGMENT_CODE }],
      })
    ).toThrowError(/must have a non-empty 'name'/i)
  })
})

describe('validateConfig layers edges', () => {
  it('rejects non-object layers entries', () => {
    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        layers: [null],
      })
    ).toThrowError(/entry 0 must be an object/i)
  })

  it('rejects whitespace-only layers names', () => {
    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        layers: [{ name: '   ', fragment: FRAGMENT_CODE }],
      })
    ).toThrowError(/must have a non-empty 'name'/i)
  })
})

// A layers entry with no streams would add nothing to the sheet, so it fails at load.
describe('validateConfig layers streams', () => {
  it('rejects a fragment-only layers entry, since only streams carry its CSS', () => {
    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        layers: [{ name: 'tokens', fragment: FRAGMENT_CODE }],
      })
    ).toThrowError(/^Config field 'layers' is invalid\.\nEntry 0 \(tokens\) must include 'streams'\./)
  })

  it('rejects a jsxElements-only layers entry and names the fix', () => {
    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        layers: [{ name: 'icons', fragment: '', jsxElements: ['HomeIcon'] }],
      })
    ).toThrowError(/Entry 0 \(icons\) must include 'streams'.*list it under 'extends'/)
  })
})

// An entry that reaches the config's own name would make the config its own upstream.
const CYCLE_STREAMS = [
  { name: SYSTEM_NAME, preamble: '' },
  { name: 'upstream', preamble: '' },
]

describe('validateConfig own-name links', () => {
  it('rejects a layers entry named as the config', () => {
    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        layers: [{ name: SYSTEM_NAME, fragment: FRAGMENT_CODE, streams: [{ name: SYSTEM_NAME, preamble: '' }] }],
      })
    ).toThrowError(/^Config field 'layers' is invalid\.\nEntry 0 \(my-system\) reaches 'my-system', this config's own name/)
  })

  it('rejects an extends entry whose streams reach the config (a cycle)', () => {
    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        extends: [{ name: 'upstream', fragment: FRAGMENT_CODE, streams: CYCLE_STREAMS }],
      })
    ).toThrowError(/^Config field 'extends' is invalid\.\nEntry 0 \(upstream\) reaches 'my-system'/)
  })

  it('rejects a layers entry whose streams reach the config (an A to B cycle)', () => {
    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        layers: [{ name: 'upstream', fragment: FRAGMENT_CODE, streams: CYCLE_STREAMS }],
      })
    ).toThrowError(/^Config field 'layers' is invalid\.\nEntry 0 \(upstream\) reaches 'my-system'/)
  })

  it('accepts a layers entry whose expansion stays clear of the config name', () => {
    const config = validateConfig({
      name: SYSTEM_NAME,
      include: DEFAULT_INCLUDE,
      layers: [
        {
          name: 'upstream',
          fragment: FRAGMENT_CODE,
          streams: [
            { name: 'tokens', preamble: '' },
            { name: 'upstream', preamble: '' },
          ],
        },
      ],
    })

    expect(config.layers?.map((sys) => sys.name)).toEqual(['upstream'])
  })
})

// A name listed twice in one field is rejected; a repeat reached only through other systems is not.
describe('validateConfig repeated entries', () => {
  it('rejects a system listed twice in layers and names the repeat', () => {
    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        layers: [
          { name: 'tokens', fragment: '', streams: STREAMS },
          { name: 'tokens', fragment: '', streams: STREAMS },
        ],
      })
    ).toThrowError(/^Config field 'layers' is invalid\.\nEntry 1 \(tokens\) repeats entry 0\. List each system once\.$/)
  })

  it('rejects a system listed twice in extends', () => {
    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        extends: [
          { name: 'base', fragment: FRAGMENT_CODE },
          { name: 'base', fragment: FRAGMENT_CODE },
        ],
      })
    ).toThrowError(/^Config field 'extends' is invalid\.\nEntry 1 \(base\) repeats entry 0\./)
  })

  it('accepts a repeat that two direct extends entries reach only through their streams', () => {
    const config = validateConfig({
      name: SYSTEM_NAME,
      include: DEFAULT_INCLUDE,
      extends: [
        {
          name: 'base',
          fragment: FRAGMENT_CODE,
          streams: [
            { name: 'tokens', preamble: '' },
            { name: 'base', preamble: '' },
          ],
        },
        {
          name: 'other',
          fragment: FRAGMENT_CODE,
          streams: [
            { name: 'tokens', preamble: '' },
            { name: 'other', preamble: '' },
          ],
        },
      ],
    })

    expect(config.extends?.map((sys) => sys.name)).toEqual(['base', 'other'])
  })
})

// A system named in both fields is rejected at load; distinct systems in both fields are accepted.
describe('validateConfig shared entries', () => {
  it('rejects a system named in both extends and layers, and names it', () => {
    expect(() =>
      validateConfig({
        name: SYSTEM_NAME,
        include: DEFAULT_INCLUDE,
        extends: [{ name: 'base', fragment: FRAGMENT_CODE, streams: STREAMS }],
        layers: [{ name: 'base', fragment: FRAGMENT_CODE, streams: STREAMS }],
      })
    ).toThrowError(
      /^Config field 'layers' is invalid\.\nEntry 0 \(base\) is also listed under 'extends'\. 'extends' already includes everything 'layers' gives, so remove it from 'layers'\.$/
    )
  })

  it('accepts distinct systems in extends and layers', () => {
    const config = validateConfig({
      name: SYSTEM_NAME,
      include: DEFAULT_INCLUDE,
      extends: [{ name: 'base', fragment: FRAGMENT_CODE, streams: STREAMS }],
      layers: [{ name: 'tint', fragment: FRAGMENT_CODE, streams: STREAMS }],
    })

    expect(config.layers?.map((sys) => sys.name)).toEqual(['tint'])
  })
})
