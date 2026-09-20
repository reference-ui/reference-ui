// Unit tests for the Neo microbundle wrapper over mocked esbuild.
// They take fake build outputs and assert code plus metafile passthrough.
// This file is a Neo-owned copy of the core microbundle tests.

import { beforeEach, describe, expect, it, vi } from 'vitest'

const buildMock = vi.hoisted(() => vi.fn())
const ENTRY_PATH = '/Users/reference-ui/tests/entry.ts'

vi.mock('esbuild', () => ({
  build: buildMock,
}))

import { microBundle } from './microbundle.ts'

describe('microBundle', () => {
  beforeEach(() => {
    buildMock.mockReset()
  })

  it('returns the first output file text', async () => {
    buildMock.mockResolvedValue({
      outputFiles: [{ path: '/Users/reference-ui/tests/entry.js', text: 'export const x = 1' }],
    })

    await expect(microBundle(ENTRY_PATH)).resolves.toBe('export const x = 1')
  })

  it('returns an empty string when esbuild returns no output file', async () => {
    buildMock.mockResolvedValue({
      outputFiles: [],
    })

    await expect(microBundle(ENTRY_PATH)).resolves.toBe('')
  })

  it('surfaces esbuild failures', async () => {
    buildMock.mockRejectedValue(new Error('esbuild exploded'))

    await expect(microBundle(ENTRY_PATH)).rejects.toThrow('esbuild exploded')
  })

  it('returns metafile data when requested via microBundleWithResult', async () => {
    buildMock.mockResolvedValue({
      metafile: { inputs: { 'entry.ts': { bytes: 1, imports: [] } }, outputs: {} },
      outputFiles: [{ path: '/Users/reference-ui/tests/entry.js', text: 'export const x = 1' }],
    })

    const { microBundleWithResult } = await import('./microbundle.ts')
    await expect(microBundleWithResult(ENTRY_PATH, { metafile: true })).resolves.toEqual({
      code: 'export const x = 1',
      metafile: { inputs: { 'entry.ts': { bytes: 1, imports: [] } }, outputs: {} },
    })
  })

  it('returns the map file text when esbuild emits one', async () => {
    buildMock.mockResolvedValue({
      outputFiles: [
        { path: '/Users/reference-ui/tests/entry.js', text: 'export const x = 1' },
        { path: '/Users/reference-ui/tests/entry.js.map', text: '{"version":3}' },
      ],
    })

    const { microBundleWithResult } = await import('./microbundle.ts')
    await expect(
      microBundleWithResult(ENTRY_PATH, { sourcemap: 'linked', outfile: '/out/entry.js' })
    ).resolves.toEqual({ code: 'export const x = 1', map: '{"version":3}' })
  })

  it('finds the bundle by extension when the map comes first', async () => {
    buildMock.mockResolvedValue({
      outputFiles: [
        { path: '/Users/reference-ui/tests/entry.js.map', text: '{"version":3}' },
        { path: '/Users/reference-ui/tests/entry.js', text: 'export const x = 1' },
      ],
    })

    const { microBundleWithResult } = await import('./microbundle.ts')
    await expect(microBundleWithResult(ENTRY_PATH, { sourcemap: 'linked' })).resolves.toEqual({
      code: 'export const x = 1',
      map: '{"version":3}',
    })
  })
})
