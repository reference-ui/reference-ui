/**
 * Prepare test sandbox: generate React 18 + Vite app, install deps, run ref sync.
 * Run before Playwright tests.
 */

import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execa } from 'execa'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Sandbox must live inside reference-test package, not at packages/
const PACKAGE_ROOT = join(__dirname, '..')
const BASE_DIR = join(PACKAGE_ROOT, 'src', 'app')
const SANDBOX_DIR = join(PACKAGE_ROOT, '.sandbox')
const CORE_PATH = join(PACKAGE_ROOT, '..', 'reference-core')
const WORKSPACE_ROOT = join(PACKAGE_ROOT, '..', '..')

async function ensureWorkspaceReady(): Promise<void> {
  const cliBuilt = existsSync(join(CORE_PATH, 'dist/cli/index.mjs'))
  if (cliBuilt && !process.env.REF_TEST_FRESH) return

  await execa('pnpm', ['install'], { cwd: WORKSPACE_ROOT })
  await execa('pnpm', ['run', 'build'], { cwd: CORE_PATH })
}

async function prepare(): Promise<void> {
  if (existsSync(SANDBOX_DIR)) {
    await rm(SANDBOX_DIR, { recursive: true, force: true })
  }
  await mkdir(SANDBOX_DIR, { recursive: true })

  await ensureWorkspaceReady()

  // Copy base app
  await cp(BASE_DIR, SANDBOX_DIR, { recursive: true })

  const packageJson = {
    name: 'ref-test-sandbox',
    private: true,
    type: 'module' as const,
    scripts: {
      build: 'vite build',
      dev: 'vite --port 5174',
    },
    dependencies: {
      react: '18.3.1',
      'react-dom': '18.3.1',
      '@reference-ui/core': `file:${CORE_PATH}`,
    },
    devDependencies: {
      vite: '5.4.0',
      '@vitejs/plugin-react': '4.3.4',
      typescript: '~5.9.3',
    },
  }

  await writeFile(
    join(SANDBOX_DIR, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  )

  await execa('pnpm', ['install', '--ignore-workspace'], { cwd: SANDBOX_DIR })
  await execa('node', [join(CORE_PATH, 'dist/cli/index.mjs'), 'sync'], {
    cwd: SANDBOX_DIR,
  })

  console.log('Sandbox ready at', SANDBOX_DIR)
}

prepare().catch((err) => {
  console.error(err)
  process.exit(1)
})
