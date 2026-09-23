import { describe, expect, it, vi } from 'vitest'
import { aliasPlugin } from './alias'

describe('aliasPlugin', () => {
  it('registers exact-match aliases with escaped filters', () => {
    const onResolve = vi.fn()
    const plugin = aliasPlugin({
      '@reference-ui/system': '/abs/system.ts',
      'pkg.with-specials?': '/abs/special.ts',
    })

    plugin.setup({
      onResolve,
    } as unknown as Parameters<typeof plugin.setup>[0])

    expect(onResolve).toHaveBeenCalledTimes(2)

    const [firstArgs, firstHandler] = onResolve.mock.calls[0] as [
      { filter: RegExp },
      () => { path: string }
    ]
    const [secondArgs, secondHandler] = onResolve.mock.calls[1] as [
      { filter: RegExp },
      () => { path: string }
    ]

    expect(firstArgs.filter.test('@reference-ui/system')).toBe(true)
    expect(firstArgs.filter.test('@reference-ui/system/extra')).toBe(false)
    expect(firstHandler()).toEqual({ path: '/abs/system.ts' })

    expect(secondArgs.filter.test('pkg.with-specials?')).toBe(true)
    expect(secondArgs.filter.test('pkgxwith-specials?')).toBe(false)
    expect(secondHandler()).toEqual({ path: '/abs/special.ts' })
  })
})
