import { beforeEach, describe, expect, it, vi } from 'vitest'

const buildMock = vi.hoisted(() => vi.fn())
const ENTRY_PATH = '/Users/reference-ui/tests/entry.ts'

vi.mock('esbuild', () => ({
  build: buildMock,
}))

import { microBundle } from './microbundle'

describe('microBundle', () => {
  beforeEach(() => {
    buildMock.mockReset()
  })

  it('returns the first output file text', async () => {
    buildMock.mockResolvedValue({
      outputFiles: [{ text: 'export const x = 1' }],
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
})
