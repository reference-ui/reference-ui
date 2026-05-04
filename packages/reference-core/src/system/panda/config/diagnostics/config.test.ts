import { afterEach, describe, expect, it, vi } from 'vitest'
import { warnOnConfigCollisions } from './config'
import { withConfigFragmentSource } from './types'

describe('config diagnostics', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('warns for font and keyframe collisions from userspace fragments', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    warnOnConfigCollisions({
      fonts: [
        withConfigFragmentSource(
          {
            name: 'sans',
            value: 'Inter, sans-serif',
            fontFace: { src: 'url(/inter.woff2)' },
            weights: { normal: '400' },
          },
          'src/theme/fonts.ts'
        ),
        withConfigFragmentSource(
          {
            name: 'sans',
            value: 'Arial, sans-serif',
            fontFace: { src: 'url(/arial.woff2)' },
            weights: { normal: '400' },
          },
          'src/components/card/fonts.ts'
        ),
      ],
      keyframes: [
        withConfigFragmentSource(
          { fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } } },
          'src/theme/animation.ts'
        ),
        withConfigFragmentSource(
          { fadeIn: { from: { opacity: 0.5 }, to: { opacity: 1 } } },
          'src/components/modal/animation.ts'
        ),
      ],
    })

    const messages = consoleWarn.mock.calls.map(call => String(call.at(-1)))
    expect(messages).toHaveLength(2)
    expect(messages[0]).toContain('Font collisions detected')
    expect(messages[0]).toContain('sans')
    expect(messages[0]).toContain('src/theme/fonts.ts')
    expect(messages[0]).toContain('src/components/card/fonts.ts')
    expect(messages[1]).toContain('Keyframe collisions detected')
    expect(messages[1]).toContain('fadeIn')
    expect(messages[1]).toContain('src/theme/animation.ts')
    expect(messages[1]).toContain('src/components/modal/animation.ts')
  })

  it('does not warn for upstream font or keyframe fragments', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    warnOnConfigCollisions({
      fonts: [
        withConfigFragmentSource(
          {
            name: 'sans',
            value: 'Inter, sans-serif',
            fontFace: { src: 'url(/inter.woff2)' },
            weights: { normal: '400' },
          },
          'upstream system fragment'
        ),
        withConfigFragmentSource(
          {
            name: 'sans',
            value: 'Arial, sans-serif',
            fontFace: { src: 'url(/arial.woff2)' },
            weights: { normal: '400' },
          },
          'src/theme/fonts.ts'
        ),
      ],
      keyframes: [
        withConfigFragmentSource(
          { fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } } },
          'upstream system fragment'
        ),
        withConfigFragmentSource(
          { fadeIn: { from: { opacity: 0.5 }, to: { opacity: 1 } } },
          'src/theme/animation.ts'
        ),
      ],
    })

    expect(consoleWarn).not.toHaveBeenCalled()
  })
})
