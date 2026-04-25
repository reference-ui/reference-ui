import { afterEach, describe, expect, it, vi } from 'vitest'
import { warnOnTokenCollisions } from './tokens'
import { withConfigFragmentSource } from './types'

describe('config token diagnostics', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('warns with token collision paths and source files', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    warnOnTokenCollisions([
      withConfigFragmentSource(
        {
          colors: {
            text: {
              link: { light: '{colors.blue.700}', dark: '{colors.blue.300}' },
            },
          },
        },
        'src/theme/colors.ts'
      ),
      withConfigFragmentSource(
        {
          colors: {
            text: {
              link: { light: '{colors.red.700}', dark: '{colors.red.300}' },
            },
          },
        },
        'src/components/Reference/theme/colors.ts'
      ),
    ])

    const message = String(consoleWarn.mock.calls[0]?.at(-1))
    expect(message).toContain('Token namespace collisions detected')
    expect(message).toContain('Colliding namespaces:')
    expect(message).toContain('colors.text')
    expect(message).toContain('src/theme/colors.ts')
    expect(message).toContain('src/components/Reference/theme/colors.ts')
    expect(message).toContain('\n     - src/theme/colors.ts')
  })

  it('warns when token namespaces overlap even when values are identical', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    warnOnTokenCollisions([
      withConfigFragmentSource(
        { colors: { gray: { 50: { value: 'oklch(98.5% 0.002 247.839)' } } } },
        'src/base-colors.ts'
      ),
      withConfigFragmentSource(
        { colors: { gray: { 50: { value: 'oklch(98.5% 0.002 247.839)' } } } },
        'src/mirror-colors.ts'
      ),
    ])

    const message = String(consoleWarn.mock.calls[0]?.at(-1))
    expect(message).toContain('colors.gray')
    expect(message).toContain('src/base-colors.ts')
    expect(message).toContain('src/mirror-colors.ts')
  })

  it('does not warn when a userspace token fragment overrides an upstream system fragment', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    warnOnTokenCollisions([
      withConfigFragmentSource(
        { colors: { reference: { text: { value: '#111827' } } } },
        'upstream system fragment'
      ),
      withConfigFragmentSource(
        { colors: { reference: { text: { value: '#020617' } } } },
        'src/theme/reference.ts'
      ),
    ])

    expect(consoleWarn).not.toHaveBeenCalled()
  })

  it('truncates large collision lists', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const left = Object.fromEntries(
      Array.from({ length: 12 }, (_, index) => [`group${index}`, { value: 'a' }])
    )
    const right = Object.fromEntries(
      Array.from({ length: 12 }, (_, index) => [`group${index}`, { value: 'b' }])
    )

    warnOnTokenCollisions([
      withConfigFragmentSource({ colors: left }, 'src/one.ts'),
      withConfigFragmentSource({ colors: right }, 'src/two.ts'),
    ])

    const message = String(consoleWarn.mock.calls[0]?.at(-1))
    expect(message).toContain('colors.group0')
    expect(message).toContain('... and 2 more')
  })
})
