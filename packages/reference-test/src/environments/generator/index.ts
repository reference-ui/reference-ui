/**
 * Generate a .sandbox project by copying the base environment and injecting package.json.
 * This is the primary way we run tests.
 */

import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { execa } from 'execa'

import { log, setDebug } from '../../lib/log.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

setDebug(!!process.env.DEBUG)

export interface Project {
  root: string
  cleanup: () => Promise<void>
}

const BASE_DIR = join(__dirname, '..', 'base')

function getCorePath(): string {
  // generator -> environments -> src -> reference-test -> packages
  return join(__dirname, '..', '..', '..', '..', 'reference-core')
}

async function ensureSandboxDir(root: string): Promise<void> {
  if (existsSync(root)) {
    await rm(root, { recursive: true, force: true })
  }
  await mkdir(root, { recursive: true })
}

export async function generateSandbox(): Promise<Project> {
  const packageRoot = join(__dirname, '..', '..', '..')
  const sandboxRoot = join(packageRoot, '.sandbox')

  log.debug('generator', 'Generating sandbox at', sandboxRoot)
  await ensureSandboxDir(sandboxRoot)

  log.debug('generator', 'Copying base environment...')
  await cp(BASE_DIR, sandboxRoot, { recursive: true })

  const corePath = getCorePath()
  const packageJson = {
    name: 'ref-test-sandbox',
    private: true,
    type: 'module' as const,
    scripts: {
      build: 'vite build',
      dev: 'vite',
      test: 'ref sync && vite build',
    },
    dependencies: {
      react: '18.3.1',
      'react-dom': '18.3.1',
      '@reference-ui/core': `file:${corePath}`,
    },
    devDependencies: {
      vite: '5.4.0',
      '@vitejs/plugin-react': '4.3.4',
      typescript: '~5.9.3',
    },
  }

  await writeFile(
    join(sandboxRoot, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  )

  log.debug('generator', 'Running pnpm install...')
  await execa('pnpm', ['install', '--ignore-workspace'], { cwd: sandboxRoot })
  log.debug('generator', 'Sandbox ready')

  return {
    root: sandboxRoot,
    cleanup: async () => {
      await rm(sandboxRoot, { recursive: true, force: true })
    },
  }
}
