/**
 * Prepare test sandboxes: generate one per matrix entry.
 * Each sandbox is a full project with its own package.json, node_modules, ref sync output.
 *
 * REF_TEST_PROJECT: when set (e.g. for test:quick), only prepare that one sandbox.
 */

import { mkdir, rm, writeFile, readdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { basename, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execa } from 'execa'

import { MATRIX, getReactVersion, getViteVersion, getPort } from '../matrix/index.js'
import type { MatrixEntry } from '../matrix/index.js'
import { composeSandbox } from '../environments/manifest.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const PACKAGE_ROOT = join(__dirname, '..', '..')
const SANDBOX_ROOT = join(PACKAGE_ROOT, '.sandbox')
const CSS_SNAPSHOT_DIR = join(PACKAGE_ROOT, 'css_snapshot')
const LEGACY_CSS_SNAPSHOT_DIR = join(PACKAGE_ROOT, 'src', 'tests', 'layer', 'css_snapshot')
const CORE_PATH = join(PACKAGE_ROOT, '..', 'reference-core')
const LIB_PATH = join(PACKAGE_ROOT, '..', 'reference-lib')
const EXTEND_FIXTURE_PATH = join(PACKAGE_ROOT, '..', '..', 'fixtures', 'extend-library')
const CORE_BIN = join(CORE_PATH, 'dist/cli/index.mjs')
const LIB_BIN = join(LIB_PATH, 'dist/index.mjs')
const WORKSPACE_ROOT = join(PACKAGE_ROOT, '..', '..')

function logStep(message: string): void {
  console.log(`[prepare] ${message}`)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function getSandboxProcessIds(sandboxDir: string): Promise<number[]> {
  try {
    const { stdout } = await execa('lsof', ['-t', '+D', sandboxDir])
    return [...new Set(
      stdout
        .split('\n')
        .map((line) => Number.parseInt(line.trim(), 10))
        .filter((pid) => Number.isInteger(pid))
    )]
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'exitCode' in error &&
      error.exitCode === 1
    ) {
      return []
    }
    throw error
  }
}

async function stopSandboxProcesses(sandboxDir: string): Promise<void> {
  const initialPids = await getSandboxProcessIds(sandboxDir)
  if (initialPids.length === 0) return

  logStep(`Stopping active sandbox processes for ${basename(sandboxDir)}`)
  for (const pid of initialPids) {
    try {
      process.kill(pid, 'SIGTERM')
    } catch {
      // Process may have already exited.
    }
  }

  await sleep(500)

  const remainingPids = await getSandboxProcessIds(sandboxDir)
  for (const pid of remainingPids) {
    try {
      process.kill(pid, 'SIGKILL')
    } catch {
      // Process may have already exited.
    }
  }

  if (remainingPids.length > 0) {
    await sleep(250)
  }
}

function interpolateTemplate(
  value: unknown,
  replacements: Record<string, string>
): unknown {
  if (typeof value === 'string') {
    return replacements[value] ?? value
  }
  if (Array.isArray(value)) {
    return value.map((item) => interpolateTemplate(item, replacements))
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [
        key,
        interpolateTemplate(entryValue, replacements),
      ])
    )
  }
  return value
}

async function buildPackageJson(entry: MatrixEntry, sandboxDir: string): Promise<object> {
  const reactVersion = getReactVersion(entry)
  const viteVersion = getViteVersion(entry)
  const rawTemplate = JSON.parse(
    await readFile(join(sandboxDir, 'package.json'), 'utf-8')
  ) as Record<string, unknown>
  const template = interpolateTemplate(rawTemplate, {
    __REF_TEST_CORE_PATH__: `link:${CORE_PATH}`,
    __REF_TEST_EXTEND_FIXTURE_PATH__: `link:${EXTEND_FIXTURE_PATH}`,
    __REF_TEST_LIB_PATH__: `link:${LIB_PATH}`,
    __REF_TEST_REACT_VERSION__: reactVersion,
    __REF_TEST_VITE_VERSION__: viteVersion,
  }) as Record<string, unknown>
  const scripts = { ...(template.scripts as Record<string, string> | undefined) }

  return {
    ...template,
    name: `ref-test-sandbox-${entry.name}`,
    scripts: {
      ...scripts,
      dev: `ref sync --watch >> ref-sync.log 2>&1 & vite --port ${getPort(entry)}`,
    },
  }
}

async function ensureWorkspaceReady(): Promise<void> {
  const needsFreshBuild = !!process.env.REF_TEST_FRESH
  const needsCoreBuild = !existsSync(CORE_BIN)
  const needsLibBuild = !existsSync(LIB_BIN)

  if (needsFreshBuild || needsCoreBuild || needsLibBuild) {
    logStep('Installing workspace dependencies')
    await execa('pnpm', ['install'], {
      cwd: WORKSPACE_ROOT,
      stdio: 'inherit',
    })
  }

  if (needsFreshBuild || needsLibBuild) {
    logStep('Building @reference-ui/lib')
    await execa('pnpm', ['run', 'build'], {
      cwd: LIB_PATH,
      stdio: 'inherit',
    })
  } else if (needsCoreBuild) {
    logStep('Building @reference-ui/core')
    await execa('pnpm', ['run', 'build'], {
      cwd: CORE_PATH,
      stdio: 'inherit',
    })
  }

  logStep('Syncing @reference-ui/lib')
  await execa('pnpm', ['exec', 'ref', 'sync'], {
    cwd: LIB_PATH,
    stdio: 'inherit',
  })
  logStep('Syncing @fixtures/extend-library')
  await execa('pnpm', ['run', 'sync'], { cwd: EXTEND_FIXTURE_PATH, stdio: 'inherit' })
  logStep('Building extend-library declarations')
  await execa('pnpm', ['exec', 'tsup'], { cwd: EXTEND_FIXTURE_PATH, stdio: 'inherit' })
  logStep('Packaging extend-library')
  await execa('node', ['scripts/build-package.mjs'], {
    cwd: EXTEND_FIXTURE_PATH,
    stdio: 'inherit',
  })
}

/** Clear ref sync output to avoid stale/corrupt state. Keeps node_modules (core, lib) intact. */
async function clearRefUiArtifacts(sandboxDir: string): Promise<void> {
  const refUiDir = join(sandboxDir, '.reference-ui')
  const scopeDir = join(sandboxDir, 'node_modules', '@reference-ui')
  await rm(refUiDir, { recursive: true, force: true })
  await rm(join(scopeDir, 'react'), { recursive: true, force: true })
  await rm(join(scopeDir, 'system'), { recursive: true, force: true })
  await rm(join(sandboxDir, 'ref-sync.log'), { force: true })
}

async function runSync(sandboxDir: string): Promise<void> {
  await execa('pnpm', ['exec', 'ref', 'sync'], {
    cwd: sandboxDir,
    stdio: 'inherit',
  })
}

async function clearGeneratedTestArtifacts(): Promise<void> {
  await rm(CSS_SNAPSHOT_DIR, { recursive: true, force: true })
  await rm(LEGACY_CSS_SNAPSHOT_DIR, { recursive: true, force: true })
}

async function prepareEntryFull(entry: MatrixEntry): Promise<void> {
  const sandboxDir = join(SANDBOX_ROOT, entry.name)

  logStep(`Preparing sandbox ${entry.name}`)
  if (existsSync(sandboxDir)) {
    await stopSandboxProcesses(sandboxDir)
    logStep(`Removing existing sandbox ${entry.name}`)
    await rm(sandboxDir, { recursive: true, force: true })
  }
  await mkdir(sandboxDir, { recursive: true })

  logStep(`Composing sandbox ${entry.name}`)
  await composeSandbox(entry, sandboxDir)

  const packageJson = await buildPackageJson(entry, sandboxDir)
  await writeFile(
    join(sandboxDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  )

  logStep(`Installing sandbox dependencies for ${entry.name}`)
  await execa('pnpm', ['install', '--ignore-workspace', '-C', sandboxDir], {
    cwd: WORKSPACE_ROOT,
  })
  logStep(`Clearing generated artifacts for ${entry.name}`)
  await clearRefUiArtifacts(sandboxDir)
  logStep(`Running ref sync for ${entry.name}`)
  await runSync(sandboxDir)
  console.log('  ✓', entry.name, '(full)')
}

async function prepareEntry(entry: MatrixEntry): Promise<void> {
  await prepareEntryFull(entry)
}

async function pruneStaleSandboxes(): Promise<void> {
  const names = new Set<string>(MATRIX.map((e) => e.name))
  if (!existsSync(SANDBOX_ROOT)) return
  const entries = await readdir(SANDBOX_ROOT, { withFileTypes: true })
  for (const e of entries) {
    if (e.isDirectory() && !names.has(e.name)) {
      const sandboxDir = join(SANDBOX_ROOT, e.name)
      await stopSandboxProcesses(sandboxDir)
      await rm(sandboxDir, { recursive: true, force: true })
      console.log('  pruned', e.name)
    }
  }
}

export async function prepare(): Promise<void> {
  await mkdir(SANDBOX_ROOT, { recursive: true })
  logStep('Clearing generated test artifacts')
  await clearGeneratedTestArtifacts()
  logStep('Ensuring workspace is ready')
  await ensureWorkspaceReady()

  const projectFilter = process.env.REF_TEST_PROJECT
  const entries = projectFilter
    ? MATRIX.filter((e) => e.name === projectFilter)
    : MATRIX
  if (projectFilter && entries.length === 0) {
    throw new Error(`Unknown REF_TEST_PROJECT: ${projectFilter}`)
  }

  console.log('Generating sandboxes:')
  for (const entry of entries) {
    await prepareEntry(entry)
  }
  if (!projectFilter) {
    await pruneStaleSandboxes()
  }
  console.log('Sandboxes ready at', SANDBOX_ROOT)
}

prepare().catch((err) => {
  console.error(err)
  process.exit(1)
})
