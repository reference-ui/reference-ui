import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type { PackageDefinition } from '../package'
import { runPostprocess } from './index'

const createdDirs: string[] = []

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'reference-ui-postprocess-'))
  createdDirs.push(dir)
  return dir
}

afterEach(() => {
  for (const dir of createdDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('packager/postprocess', () => {
  it('runs injectLayerName when package declares postprocess injectLayerName', () => {
    const targetDir = createTempDir()
    writeFileSync(
      resolve(targetDir, 'react.mjs'),
      'export const layer = "__REFERENCE_UI_LAYER_NAME__"\n'
    )
    const pkg: PackageDefinition = {
      name: '@reference-ui/react',
      version: '0.0.0-test',
      description: 'react',
      main: './react.mjs',
      types: './react.d.mts',
      exports: {},
      postprocess: ['injectLayerName'],
    }

    runPostprocess(targetDir, pkg, { layerName: 'my-layer' })

    expect(readFileSync(resolve(targetDir, 'react.mjs'), 'utf-8')).toContain('my-layer')
    expect(readFileSync(resolve(targetDir, 'react.mjs'), 'utf-8')).not.toContain(
      '__REFERENCE_UI_LAYER_NAME__'
    )
  })

  it('does nothing when package has no postprocess steps', () => {
    const targetDir = createTempDir()
    writeFileSync(resolve(targetDir, 'system.mjs'), 'export const x = "__REFERENCE_UI_LAYER_NAME__"\n')
    const pkg: PackageDefinition = {
      name: '@reference-ui/system',
      version: '0.0.0-test',
      description: 'system',
      main: './system.mjs',
      types: './system.d.mts',
      exports: {},
    }

    runPostprocess(targetDir, pkg, { layerName: 'other' })

    expect(readFileSync(resolve(targetDir, 'system.mjs'), 'utf-8')).toContain(
      '__REFERENCE_UI_LAYER_NAME__'
    )
  })

  it('does nothing when postprocess array is empty', () => {
    const targetDir = createTempDir()
    const pkg: PackageDefinition = {
      name: '@reference-ui/react',
      version: '0.0.0-test',
      description: 'react',
      main: './react.mjs',
      types: './react.d.mts',
      exports: {},
      postprocess: [],
    }

    expect(() => runPostprocess(targetDir, pkg, { layerName: 'x' })).not.toThrow()
  })
})
