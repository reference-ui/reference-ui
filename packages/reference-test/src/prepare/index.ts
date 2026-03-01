/**
 * Prepare test sandboxes: generate one per matrix entry.
 * Each sandbox is a full project with its own package.json, node_modules, ref sync output.
 *
 * Incremental: does not nuke .sandbox every run. Reuses existing sandboxes when
 * app config and deps are unchanged. Only re-runs ref sync when reference-core
 * has been rebuilt. REF_TEST_FRESH=1 forces full rebuild.
 *
 * REF_TEST_PROJECT: when set (e.g. for test:quick), only prepare that one sandbox.
 */

import { cp, mkdir, rm, readFile, writeFile, readdir } from 'node:fs/promises'
import { existsSync, statSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { execa } from 'execa'

import { MATRIX, getReactVersion, getViteVersion, getPort } from '../matrix/index.js'
import type { MatrixEntry } from '../matrix/index.js'
import { composeSandbox } from '../environments/manifest.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const PACKAGE_ROOT = join(__dirname, '..', '..')
const ENVIRONMENTS_ROOT = join(PACKAGE_ROOT, 'src', 'environments')
const LIB_DIR = join(PACKAGE_ROOT, 'src', 'config', 'lib')
const SANDBOX_ROOT = join(PACKAGE_ROOT, '.sandbox')
const CORE_PATH = join(PACKAGE_ROOT, '..', 'reference-core')
const CORE_CLI = join(CORE_PATH, 'dist/cli/index.mjs')
const WORKSPACE_ROOT = join(PACKAGE_ROOT, '..', '..')

const PREP_STATE_FILE = '.prep-state.json'

interface PrepState {
  prepHash: string
  coreHash: string
}

async function hashAppDir(dir: string): Promise<string> {
  const hash = createHash('sha256')
  const files: string[] = []
  async function walk(path: string): Promise<void> {
    const entries = await readdir(path, { withFileTypes: true })
    for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const full = join(path, e.name)
      const rel = relative(dir, full)
      if (e.isDirectory()) {
        await walk(full)
      } else {
        files.push(rel)
      }
    }
  }
  await walk(dir)
  for (const f of files.sort()) {
    const content = await readFile(join(dir, f), 'utf-8').catch(() => '')
    hash.update(f + '\0' + content)
  }
  return hash.digest('hex')
}

function getCoreHash(): string {
  try {
    const st = statSync(CORE_CLI)
    return createHash('sha256').update(`${st.mtimeMs}-${st.size}`).digest('hex')
  } catch {
    return ''
  }
}

function buildPackageJson(entry: MatrixEntry): object {
  const reactVersion = getReactVersion(entry)
  const viteVersion = getViteVersion(entry)
  return {
    name: `ref-test-sandbox-${entry.name}`,
    private: true,
    type: 'module' as const,
    scripts: {
      build: 'vite build',
      dev: `ref sync --watch & vite --port ${getPort(entry)}`,
    },
    dependencies: {
      react: reactVersion,
      'react-dom': reactVersion,
      '@reference-ui/core': `file:${CORE_PATH}`,
    },
    devDependencies: {
      vite: viteVersion,
      '@vitejs/plugin-react': '4.3.4',
      typescript: '~5.9.3',
    },
  }
}

function computePrepHash(packageJson: object, appHash: string, libHash: string): string {
  return createHash('sha256')
    .update(appHash + libHash + JSON.stringify(packageJson))
    .digest('hex')
}

async function ensureWorkspaceReady(): Promise<void> {
  if (!existsSync(CORE_CLI) || process.env.REF_TEST_FRESH) {
    await execa('pnpm', ['install'], { cwd: WORKSPACE_ROOT })
    await execa('pnpm', ['run', 'build'], { cwd: CORE_PATH })
  }
}

async function readPrepState(sandboxDir: string): Promise<PrepState | null> {
  try {
    const raw = await readFile(join(sandboxDir, PREP_STATE_FILE), 'utf-8')
    return JSON.parse(raw) as PrepState
  } catch {
    return null
  }
}

async function writePrepState(sandboxDir: string, state: PrepState): Promise<void> {
  await writeFile(join(sandboxDir, PREP_STATE_FILE), JSON.stringify(state, null, 0))
}

async function runSync(sandboxDir: string): Promise<void> {
  await execa('node', [CORE_CLI, 'sync'], {
    cwd: sandboxDir,
    stdio: 'inherit',
  })
}

async function prepareEntryFull(entry: MatrixEntry): Promise<void> {
  const sandboxDir = join(SANDBOX_ROOT, entry.name)

  if (existsSync(sandboxDir)) {
    await rm(sandboxDir, { recursive: true, force: true })
  }
  await mkdir(sandboxDir, { recursive: true })

  await composeSandbox(entry, sandboxDir)

  // Copy lib into sandbox (app imports via alias lib/*)
  const sandboxLib = join(sandboxDir, 'lib')
  if (existsSync(sandboxLib)) await rm(sandboxLib, { recursive: true, force: true })
  await cp(LIB_DIR, sandboxLib, { recursive: true })

  const packageJson = buildPackageJson(entry)
  await writeFile(
    join(sandboxDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  )

  await execa('pnpm', ['install', '--ignore-workspace', '-C', sandboxDir], {
    cwd: WORKSPACE_ROOT,
  })
  await runSync(sandboxDir)

  const envHash = await hashAppDir(ENVIRONMENTS_ROOT)
  const libHash = existsSync(LIB_DIR) ? await hashAppDir(LIB_DIR) : ''
  await writePrepState(sandboxDir, {
    prepHash: computePrepHash(packageJson, envHash, libHash),
    coreHash: getCoreHash(),
  })
  console.log('  ✓', entry.name, '(full)')
}

async function prepareEntrySyncOnly(entry: MatrixEntry, prepHash: string): Promise<void> {
  const sandboxDir = join(SANDBOX_ROOT, entry.name)
  await runSync(sandboxDir)
  await writePrepState(sandboxDir, {
    prepHash,
    coreHash: getCoreHash(),
  })
  console.log('  ✓', entry.name, '(sync only)')
}

async function prepareEntry(entry: MatrixEntry): Promise<void> {
  const forceFresh = !!process.env.REF_TEST_FRESH
  const sandboxDir = join(SANDBOX_ROOT, entry.name)

  const envHash = await hashAppDir(ENVIRONMENTS_ROOT)
  const libHash = existsSync(LIB_DIR) ? await hashAppDir(LIB_DIR) : ''
  const packageJson = buildPackageJson(entry)
  const prepHash = computePrepHash(packageJson, envHash, libHash)
  const coreHash = getCoreHash()

  if (!forceFresh && existsSync(sandboxDir)) {
    const state = await readPrepState(sandboxDir)
    if (state?.prepHash === prepHash) {
      if (state.coreHash === coreHash) {
        console.log('  ✓', entry.name, '(cached)')
        return
      }
      await prepareEntrySyncOnly(entry, prepHash)
      return
    }
  }

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
