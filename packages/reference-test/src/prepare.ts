/**
 * Prepare test sandboxes: generate one per matrix entry.
 * Each sandbox is a full project with its own package.json, node_modules, ref sync output.
 */

import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execa } from 'execa'

import { MATRIX, getReactVersion, getViteVersion, getPort } from './matrix.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const PACKAGE_ROOT = join(__dirname, '..')
const BASE_DIR = join(PACKAGE_ROOT, 'src', 'app')
const SANDBOX_ROOT = join(PACKAGE_ROOT, '.sandbox')
const CORE_PATH = join(PACKAGE_ROOT, '..', 'reference-core')
const WORKSPACE_ROOT = join(PACKAGE_ROOT, '..', '..')

async function ensureWorkspaceReady(): Promise<void> {
  const cliBuilt = existsSync(join(CORE_PATH, 'dist/cli/index.mjs'))
  if (cliBuilt && !process.env.REF_TEST_FRESH) return

  await execa('pnpm', ['install'], { cwd: WORKSPACE_ROOT })
  await execa('pnpm', ['run', 'build'], { cwd: CORE_PATH })
}

async function prepareEntry(entry: (typeof MATRIX)[number]): Promise<void> {
  const sandboxDir = join(SANDBOX_ROOT, entry.name)

  if (existsSync(sandboxDir)) {
    await rm(sandboxDir, { recursive: true, force: true })
  }
  await mkdir(sandboxDir, { recursive: true })

  // Copy base app
  await cp(BASE_DIR, sandboxDir, { recursive: true })

  // Use React 17 entry point for react17; base main.tsx is for React 18+

  // Use correct main.tsx for React version
  if (entry.react === '17') {
    const main17 = await readFile(join(BASE_DIR, 'main.react17.tsx'), 'utf-8')
    await writeFile(join(sandboxDir, 'main.tsx'), main17)
  }

  const reactVersion = getReactVersion(entry)
  const viteVersion = getViteVersion(entry)

  const packageJson = {
    name: `ref-test-sandbox-${entry.name}`,
    private: true,
    type: 'module' as const,
    scripts: {
      build: 'vite build',
      dev: `vite --port ${getPort(entry)}`,
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

  await writeFile(
    join(sandboxDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  )

  // Use -C to avoid uv_cwd issues (pnpm can fail when cwd is in a freshly recreated dir)
  await execa('pnpm', ['install', '--ignore-workspace', '-C', sandboxDir], {
    cwd: WORKSPACE_ROOT, // Run from stable dir; -C points pnpm at sandbox
  })
  await execa('node', [join(CORE_PATH, 'dist/cli/index.mjs'), 'sync'], {
    cwd: sandboxDir,
  })

  console.log('  ✓', entry.name)
}

async function prepare(): Promise<void> {
  if (existsSync(SANDBOX_ROOT)) {
    await rm(SANDBOX_ROOT, { recursive: true, force: true })
  }
  await mkdir(SANDBOX_ROOT, { recursive: true })

  await ensureWorkspaceReady()

  console.log('Generating sandboxes:')
  for (const entry of MATRIX) {
    await prepareEntry(entry)
  }
  console.log('Sandboxes ready at', SANDBOX_ROOT)
}

prepare().catch((err) => {
  console.error(err)
  process.exit(1)
})
