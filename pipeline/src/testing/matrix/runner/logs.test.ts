import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { after, describe, it } from 'node:test'
import { resetMatrixConsumerArtifactsDir, writeStageLog } from './logs.js'

const tempDirs: string[] = []

after(async () => {
  await Promise.all(tempDirs.map(dir => rm(dir, { force: true, recursive: true })))
})

async function withTemporaryMatrixLogDir(test: (tempLogDir: string) => Promise<void>): Promise<void> {
  const tempRootDir = await mkdtemp(resolve(tmpdir(), 'reference-ui-matrix-logs-'))
  const tempLogDir = resolve(tempRootDir, 'testing', 'matrix')

  tempDirs.push(tempRootDir)
  await test(tempLogDir)
}

describe('matrix runner log helpers', () => {
  it('removes current consumer artifacts and legacy generated snapshots while keeping logs', async () => {
    await withTemporaryMatrixLogDir(async (tempLogDir) => {
      const staleArtifactDir = resolve(tempLogDir, 'artifacts', 'matrix-old-run')
      const legacyGeneratedDir = resolve(tempLogDir, 'generated', 'matrix-older-run')
      const preservedLogPath = resolve(tempLogDir, 'publish.log')

      await mkdir(staleArtifactDir, { recursive: true })
      await mkdir(legacyGeneratedDir, { recursive: true })
      await writeFile(resolve(staleArtifactDir, 'package.json'), '{"name":"stale"}\n')
      await writeFile(resolve(legacyGeneratedDir, 'package.json'), '{"name":"legacy"}\n')
      await writeFile(preservedLogPath, 'published\n')

      await resetMatrixConsumerArtifactsDir(tempLogDir)

      await assert.rejects(readFile(resolve(staleArtifactDir, 'package.json'), 'utf8'))
      await assert.rejects(readFile(resolve(legacyGeneratedDir, 'package.json'), 'utf8'))
      assert.equal(await readFile(preservedLogPath, 'utf8'), 'published\n')
      await writeStageLog('install.log', 'ok\n', tempLogDir)
      assert.equal(await readFile(resolve(tempLogDir, 'install.log'), 'utf8'), 'ok\n')
    })
  })

  it('writes logs into the provided matrix log directory', async () => {
    await withTemporaryMatrixLogDir(async (tempLogDir) => {
      await writeStageLog('custom.log', 'hello\n', tempLogDir)

      assert.equal(await readFile(resolve(tempLogDir, 'custom.log'), 'utf8'), 'hello\n')
    })
  })
})