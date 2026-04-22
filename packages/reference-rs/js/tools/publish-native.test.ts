import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

const createdDirs: string[] = []

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'reference-ui-publish-native-'))
  createdDirs.push(dir)
  return dir
}

async function importPublishNativeModule(options: {
  packageDir: string
  artifactsDir: string
  argv?: string[]
  published?: string[]
}) {
  vi.resetModules()

  const runCalls: Array<{ command: string; args: string[]; cwd?: string }> = []
  const published = new Set(options.published ?? [])

  vi.stubGlobal('process', {
    ...process,
    argv: ['node', 'publish-native.ts', ...(options.argv ?? [])],
  })

  vi.doMock('../shared/paths', () => ({
    packageDir: options.packageDir,
    artifactsDir: options.artifactsDir,
  }))
  vi.doMock('node:child_process', () => ({
    execFileSync: (command: string, args: string[], execOptions?: { cwd?: string; encoding?: string }) => {
      runCalls.push({ command, args, cwd: execOptions?.cwd })

      if (command === 'npm' && args[0] === 'view') {
        const spec = args[1]
        if (published.has(spec)) {
          return '0.0.14'
        }
        throw new Error('not published')
      }

      return ''
    },
  }))

  await import('./publish-native')
  return { runCalls }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('../shared/paths')
  vi.doUnmock('node:child_process')
  vi.unstubAllGlobals()
  vi.restoreAllMocks()

  for (const dir of createdDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('publish-native', () => {
  it('publishes the root package while optionalDependencies are present when requested', async () => {
    const packageDir = createTempDir()
    const artifactsDir = resolve(packageDir, 'artifacts')
    const npmDir = resolve(packageDir, 'npm')
    const nativePkgDir = resolve(npmDir, 'darwin-arm64')
    mkdirSync(artifactsDir, { recursive: true })
    mkdirSync(nativePkgDir, { recursive: true })

    writeFileSync(
      resolve(packageDir, 'package.json'),
      JSON.stringify({ name: '@reference-ui/rust', version: '0.0.14' }, null, 2),
      'utf-8'
    )
    writeFileSync(
      resolve(nativePkgDir, 'package.json'),
      JSON.stringify({
        name: '@reference-ui/rust-darwin-arm64',
        version: '0.0.14',
      }, null, 2),
      'utf-8'
    )

    const { runCalls } = await importPublishNativeModule({
      packageDir,
      artifactsDir,
      argv: ['--publish-root'],
    })

    expect(runCalls).toEqual([
      {
        command: 'pnpm',
        args: ['run', 'create-npm-dirs'],
        cwd: packageDir,
      },
      {
        command: 'pnpm',
        args: ['run', 'artifacts'],
        cwd: packageDir,
      },
      {
        command: 'npm',
        args: ['view', '@reference-ui/rust-darwin-arm64@0.0.14', 'version', '--json'],
        cwd: packageDir,
      },
      {
        command: 'npm',
        args: ['publish', '--provenance', '--access', 'public'],
        cwd: nativePkgDir,
      },
      {
        command: 'npm',
        args: ['view', '@reference-ui/rust@0.0.14', 'version', '--json'],
        cwd: packageDir,
      },
      {
        command: 'npm',
        args: ['publish', '--provenance', '--access', 'public'],
        cwd: packageDir,
      },
    ])

    const restoredPackageJson = JSON.parse(readFileSync(resolve(packageDir, 'package.json'), 'utf8'))
    expect(restoredPackageJson.optionalDependencies).toBeUndefined()
  })
})