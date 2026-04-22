/**
 * Containerized downstream smoke test for publish-style package tarballs.
 *
 * This script assembles built internal packages, installs them in a clean
 * consumer, and proves the packaged boundary still works outside the workspace.
 */

import { dag } from '@dagger.io/dagger'
import * as dagger from '@dagger.io/dagger'
import { constants } from 'node:fs'
import { access, readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const pipelineDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(pipelineDir, '..')

const repoPathInContainer = '/workspace'
const packDirInContainer = '/packs'
const consumerDirInContainer = '/consumer'

function isDirectExecution(): boolean {
  return process.argv[1] === fileURLToPath(import.meta.url)
}

const internalPackages = [
  {
    name: '@reference-ui/rust',
    dir: 'packages/reference-rs',
    requiredBuildOutputs: ['dist/index.mjs', 'native'],
  },
  {
    name: '@reference-ui/icons',
    dir: 'packages/reference-icons',
    requiredBuildOutputs: ['dist/index.mjs'],
  },
  {
    name: '@reference-ui/core',
    dir: 'packages/reference-core',
    requiredBuildOutputs: ['dist/cli/index.mjs'],
  },
  {
    name: '@reference-ui/lib',
    dir: 'packages/reference-lib',
    requiredBuildOutputs: ['dist/index.mjs', '.reference-ui/system/baseSystem.mjs'],
  },
] as const

const rootExcludes = [
  '.git',
  '**/node_modules',
  '**/.turbo',
  '**/.pnpm-store',
  'target',
  'packages/reference-docs/dist',
  'packages/reference-e2e/blob-reports',
  'packages/reference-e2e/playwright-report',
  'packages/reference-e2e/test-results',
  'packages/reference-e2e/matrix-logs',
  'pipeline/node_modules',
] as const

interface PackageInfo {
  name: string
  version: string
  dir: string
}

function packedTarballName(name: string, version: string): string {
  return `${name.replace(/^@/, '').replace('/', '-')}-${version}.tgz`
}

async function readPackageInfo(dir: string): Promise<PackageInfo> {
  const packageJsonPath = resolve(repoRoot, dir, 'package.json')
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8')) as {
    name: string
    version: string
  }

  return {
    name: packageJson.name,
    version: packageJson.version,
    dir,
  }
}

async function assertBuiltOutputs(): Promise<void> {
  for (const pkg of internalPackages) {
    for (const relativePath of pkg.requiredBuildOutputs) {
      const absolutePath = resolve(repoRoot, pkg.dir, relativePath)
      try {
        await access(absolutePath, constants.F_OK)
      } catch {
        throw new Error(
          `Missing required build output ${absolutePath}. Build the package outputs first, then rerun the downstream smoke pipeline.`
        )
      }
    }
  }
}

function repoSource() {
  return dag.host().directory(repoRoot, {
    exclude: [...rootExcludes],
  })
}

function baseNodeContainer() {
  const pnpmStore = dag.cacheVolume('reference-ui-pipeline-pnpm-store')

  return dag
    .container()
    .from('node:24-bookworm')
    .withEnvVariable('PNPM_STORE_DIR', '/pnpm/store')
    .withMountedCache('/pnpm/store', pnpmStore)
    .withExec(['corepack', 'enable'])
    .withExec(['corepack', 'prepare', 'pnpm@10.29.3', '--activate'])
}

function consumerPackageJson(packages: readonly PackageInfo[]): string {
  const dependencyEntries = Object.fromEntries(
    packages.map(pkg => [pkg.name, `file:../packs/${packedTarballName(pkg.name, pkg.version)}`])
  )

  return `${JSON.stringify(
    {
      name: 'reference-ui-downstream-smoke',
      private: true,
      type: 'module',
      scripts: {
        sync: 'ref sync',
      },
      dependencies: {
        ...dependencyEntries,
        react: '^19.2.4',
        'react-dom': '^19.2.4',
      },
      devDependencies: {
        '@types/react': '^19.2.14',
        '@types/react-dom': '^19.2.3',
        typescript: '~5.9.3',
      },
    },
    null,
    2
  )}\n`
}

function consumerTsconfig(): string {
  return `${JSON.stringify(
    {
      compilerOptions: {
        jsx: 'react-jsx',
        module: 'esnext',
        moduleResolution: 'bundler',
        target: 'es2022',
        strict: true,
        skipLibCheck: true,
      },
      include: ['src/**/*', 'ui.config.ts'],
    },
    null,
    2
  )}\n`
}

function consumerConfigSource(): string {
  return [
    "import { defineConfig } from '@reference-ui/core'",
    "import { baseSystem } from '@reference-ui/lib'",
    '',
    'export default defineConfig({',
    "  name: 'dagger-downstream-smoke',",
    "  include: ['src/**/*.{ts,tsx}'],",
    '  extends: [baseSystem],',
    '  debug: false,',
    '})',
    '',
  ].join('\n')
}

function consumerSourceFile(): string {
  return [
    "export function App() {",
    "  return <div>Reference UI downstream smoke</div>",
    '}',
    '',
  ].join('\n')
}

export async function runDownstreamSmoke(): Promise<void> {
  await assertBuiltOutputs()

  const packageInfos = await Promise.all(internalPackages.map(pkg => readPackageInfo(pkg.dir)))

  let workspace = baseNodeContainer()
    .withDirectory(repoPathInContainer, repoSource())
    .withWorkdir(repoPathInContainer)
    .withExec(['pnpm', 'install', '--frozen-lockfile', '--ignore-scripts'])
    .withExec(['mkdir', '-p', packDirInContainer])

  for (const pkg of packageInfos) {
    workspace = workspace
      .withWorkdir(`${repoPathInContainer}/${pkg.dir}`)
      .withExec(['pnpm', 'pack', '--pack-destination', packDirInContainer, '--ignore-scripts'])
  }

  const consumer = workspace
    .withNewFile(`${consumerDirInContainer}/package.json`, consumerPackageJson(packageInfos))
    .withNewFile(`${consumerDirInContainer}/tsconfig.json`, consumerTsconfig())
    .withNewFile(`${consumerDirInContainer}/ui.config.ts`, consumerConfigSource())
    .withNewFile(`${consumerDirInContainer}/src/index.tsx`, consumerSourceFile())
    .withWorkdir(consumerDirInContainer)
    .withExec(['pnpm', 'install'])

  const syncRunner = consumer.withExec(['pnpm', 'exec', 'ref', 'sync'])

  try {
    const output = await syncRunner.stdout()
    process.stdout.write(output)
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message)
    }
    process.exitCode = 1
  }
}

if (isDirectExecution()) {
  await dagger.connection(runDownstreamSmoke, { LogOutput: process.stderr })
}