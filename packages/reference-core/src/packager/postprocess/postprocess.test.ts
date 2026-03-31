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

  it('rewrites the generated types runtime placeholder to the tasty runtime subpath', () => {
    const targetDir = createTempDir()
    writeFileSync(
      resolve(targetDir, 'types.mjs'),
      'const load = () => import("__REFERENCE_UI_TYPES_RUNTIME__")\n'
    )
    const pkg: PackageDefinition = {
      name: '@reference-ui/types',
      version: '0.0.0-test',
      description: 'types',
      main: './types.mjs',
      types: './types.d.mts',
      exports: {},
      postprocess: ['rewriteTypesRuntimeImport'],
    }

    runPostprocess(targetDir, pkg, { layerName: 'unused' })

    const output = readFileSync(resolve(targetDir, 'types.mjs'), 'utf-8')
    expect(output).toContain('import("./tasty/runtime.js")')
    expect(output).not.toContain('__REFERENCE_UI_TYPES_RUNTIME__')
  })

  it('fails when the generated types bundle is missing the runtime placeholder', () => {
    const targetDir = createTempDir()
    writeFileSync(
      resolve(targetDir, 'types.mjs'),
      'const load = () => import("./not-the-runtime.js")\n'
    )
    const pkg: PackageDefinition = {
      name: '@reference-ui/types',
      version: '0.0.0-test',
      description: 'types',
      main: './types.mjs',
      types: './types.d.mts',
      exports: {},
      postprocess: ['rewriteTypesRuntimeImport'],
    }

    expect(() => runPostprocess(targetDir, pkg, { layerName: 'unused' })).toThrow(
      'Expected @reference-ui/types bundle to contain __REFERENCE_UI_TYPES_RUNTIME__ before postprocess'
    )
  })
})
