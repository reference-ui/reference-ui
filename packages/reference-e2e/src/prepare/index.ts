/**
 * Prepare test sandboxes: generate one per matrix entry.
 * Each sandbox is a full project with its own package.json, node_modules, ref sync output.
 *
 * REF_TEST_PROJECT: when set (e.g. for test:quick), only prepare that one sandbox.
 */

import { mkdir, rm, writeFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
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
const CORE_BIN = join(CORE_PATH, 'dist/cli/index.mjs')
const LIB_BIN = join(LIB_PATH, 'dist/index.mjs')
const WORKSPACE_ROOT = join(PACKAGE_ROOT, '..', '..')

function buildPackageJson(entry: MatrixEntry): object {
  const reactVersion = getReactVersion(entry)
  const viteVersion = getViteVersion(entry)
  return {
    name: `ref-test-sandbox-${entry.name}`,
    private: true,
    type: 'module' as const,
    scripts: {
      build: 'vite build',
      dev: `ref sync --watch >> ref-sync.log 2>&1 & vite --port ${getPort(entry)}`,
    },
    dependencies: {
      react: reactVersion,
      'react-dom': reactVersion,
      '@reference-ui/core': `link:${CORE_PATH}`,
      '@reference-ui/lib': `link:${LIB_PATH}`,
    },
    devDependencies: {
      vite: viteVersion,
      '@vitejs/plugin-react': '4.3.4',
      typescript: '~5.9.3',
    },
  }
}

async function ensureWorkspaceReady(): Promise<void> {
  const needsFreshBuild = !!process.env.REF_TEST_FRESH
  const needsCoreBuild = !existsSync(CORE_BIN)
  const needsLibBuild = !existsSync(LIB_BIN)

  if (needsFreshBuild || needsCoreBuild || needsLibBuild) {
    await execa('pnpm', ['install'], { cwd: WORKSPACE_ROOT })
  }

  if (needsFreshBuild || needsLibBuild) {
    await execa('pnpm', ['run', 'build'], { cwd: LIB_PATH })
  } else if (needsCoreBuild) {
    await execa('pnpm', ['run', 'build'], { cwd: CORE_PATH })
  }

  await execa('pnpm', ['exec', 'ref', 'sync'], { cwd: LIB_PATH, stdio: 'pipe' })
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

  if (existsSync(sandboxDir)) {
    await rm(sandboxDir, { recursive: true, force: true })
  }
  await mkdir(sandboxDir, { recursive: true })

  await composeSandbox(entry, sandboxDir)

  const packageJson = buildPackageJson(entry)
  await writeFile(
    join(sandboxDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  )

  await execa('pnpm', ['install', '--ignore-workspace', '-C', sandboxDir], {
    cwd: WORKSPACE_ROOT,
  })
  await clearRefUiArtifacts(sandboxDir)
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
      await rm(join(SANDBOX_ROOT, e.name), { recursive: true, force: true })
      console.log('  pruned', e.name)
    }
  }
}

export async function prepare(): Promise<void> {
  await mkdir(SANDBOX_ROOT, { recursive: true })
  await clearGeneratedTestArtifacts()
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
