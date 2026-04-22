import { afterEach, describe, expect, it, vi } from 'vitest'

async function importPublishModule(options) {
  vi.resetModules()

  const run = vi.fn()
  vi.doMock('./shared.mjs', () => ({
    RUST_PACKAGE: '@reference-ui/rust',
    getReleaseTargetPackages: () => ({
      releasePackages: options.releasePackages,
    }),
    isPublished: (name, version) =>
      options.published?.some((pkg) => pkg.name === name && pkg.version === version) ?? false,
    run,
    sortPackagesForPublish: (packages) => packages,
  }))

  await import('./publish.mjs')
  return { run }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('./shared.mjs')
  vi.restoreAllMocks()
})

describe('release publish', () => {
  it('publishes rust through publish:native and skips publishing the root package twice', async () => {
    const releasePackages = [
      { name: '@reference-ui/rust', version: '0.0.14', dir: '/repo/packages/reference-rs', dependencies: {} },
      { name: '@reference-ui/core', version: '0.0.15', dir: '/repo/packages/reference-core', dependencies: { '@reference-ui/rust': '0.0.14' } },
    ]

    const { run } = await importPublishModule({ releasePackages, published: [] })

    expect(run).toHaveBeenCalledTimes(2)
    expect(run).toHaveBeenNthCalledWith(
      1,
      'pnpm',
      ['--filter', '@reference-ui/rust', 'run', 'publish:native', '--', '--publish-root']
    )
    expect(run).toHaveBeenNthCalledWith(
      2,
      'pnpm',
      ['publish', '--no-git-checks', '--access', 'public'],
      { cwd: '/repo/packages/reference-core' }
    )
  })
})