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
  env?: Record<string, string | undefined>
}) {
  vi.resetModules()

  const runCalls: Array<{ command: string; args: string[]; cwd?: string }> = []
  const published = new Set(options.published ?? [])

  vi.stubGlobal('process', {
    ...process,
    argv: ['node', 'publish-native.ts', ...(options.argv ?? [])],
    env: {
      ...process.env,
      ...options.env,
    },
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

function createNativePublishFixture() {
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
    JSON.stringify(
      {
        name: '@reference-ui/rust-darwin-arm64',
        version: '0.0.14',
      },
      null,
      2
    ),
    'utf-8'
  )

  return { packageDir, artifactsDir, nativePkgDir }
}

function filterCommandCalls(
  runCalls: Array<{ command: string; args: string[]; cwd?: string }>,
  command: string,
  subcommand: string
) {
  return runCalls.filter((call) => call.command === command && call.args[0] === subcommand)
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
  it('publishes native and root packages when requested and restores the root package manifest', async () => {
    const { packageDir, artifactsDir, nativePkgDir } = createNativePublishFixture()

    const { runCalls } = await importPublishNativeModule({
      packageDir,
      artifactsDir,
      argv: ['--publish-root'],
    })

    expect(runCalls).toContainEqual({
      command: 'pnpm',
      args: ['run', 'create-npm-dirs'],
      cwd: packageDir,
    })
    expect(runCalls).toContainEqual({
      command: 'pnpm',
      args: ['run', 'artifacts'],
      cwd: packageDir,
    })

    expect(filterCommandCalls(runCalls, 'npm', 'view')).toEqual(
      expect.arrayContaining([
        {
          command: 'npm',
          args: ['view', '@reference-ui/rust-darwin-arm64@0.0.14', 'version', '--json'],
          cwd: packageDir,
        },
        {
          command: 'npm',
          args: ['view', '@reference-ui/rust@0.0.14', 'version', '--json'],
          cwd: packageDir,
        },
      ])
    )

    expect(filterCommandCalls(runCalls, 'npm', 'publish')).toEqual(
      expect.arrayContaining([
        {
          command: 'npm',
          args: ['publish', '--access', 'public'],
          cwd: nativePkgDir,
        },
        {
          command: 'npm',
          args: ['publish', '--access', 'public'],
          cwd: packageDir,
        },
      ])
    )

    const restoredPackageJson = JSON.parse(readFileSync(resolve(packageDir, 'package.json'), 'utf8'))
    expect(restoredPackageJson.optionalDependencies).toBeUndefined()
  })

  it('adds provenance to publish commands when provenance publishing is enabled', async () => {
    const { packageDir, artifactsDir, nativePkgDir } = createNativePublishFixture()

    const { runCalls } = await importPublishNativeModule({
      packageDir,
      artifactsDir,
      argv: ['--publish-root'],
      env: {
        REF_RELEASE_PROVENANCE: 'true',
      },
    })

    expect(filterCommandCalls(runCalls, 'npm', 'publish')).toEqual(
      expect.arrayContaining([
        {
          command: 'npm',
          args: ['publish', '--provenance', '--access', 'public'],
          cwd: nativePkgDir,
        },
        {
          command: 'npm',
          args: ['publish', '--provenance', '--access', 'public'],
          cwd: packageDir,
        },
      ])
    )
  })
})