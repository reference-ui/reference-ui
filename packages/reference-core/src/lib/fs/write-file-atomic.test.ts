import * as fs from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

const created: string[] = []

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('node:fs')
  vi.restoreAllMocks()
  for (const dir of created.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

async function importWriteFileAtomic() {
  return import('./write-file-atomic')
}

describe('writeFileAtomic', () => {
  it('creates parent directories and writes the final file', async () => {
    const root = fs.mkdtempSync(join(tmpdir(), 'ref-write-file-atomic-'))
    created.push(root)
    const filePath = join(root, 'nested', 'artifact.txt')
    const { writeFileAtomic } = await importWriteFileAtomic()

    writeFileAtomic(filePath, 'hello world', 'utf-8')

    expect(fs.readFileSync(filePath, 'utf-8')).toBe('hello world')
  })

  it('cleans up the temp file when the write fails', async () => {
    const root = fs.mkdtempSync(join(tmpdir(), 'ref-write-file-atomic-'))
    created.push(root)
    const filePath = join(root, 'artifact.txt')
    const tempPaths: string[] = []

    vi.doMock('node:fs', async () => {
      const actual = await vi.importActual<typeof import('node:fs')>('node:fs')
      return {
        ...actual,
        writeFileSync(path: fs.PathOrFileDescriptor) {
          tempPaths.push(String(path))
          throw new Error('boom')
        },
      }
    })

    const { writeFileAtomic } = await importWriteFileAtomic()

    expect(() => writeFileAtomic(filePath, 'hello world', 'utf-8')).toThrow('boom')
    expect(fs.existsSync(filePath)).toBe(false)
    expect(tempPaths).toHaveLength(1)
    expect(fs.existsSync(tempPaths[0])).toBe(false)
  })
})