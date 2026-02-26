/**
 * Generate a .sandbox project by copying the base environment and injecting package.json.
 * Supports per-project ui.config.ts from environments/configs/{projectName}/
 */

import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { execa } from 'execa'

import { log, setDebug } from '../../lib/log.js'
import type { MatrixEntry } from '../matrix.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

setDebug(!!process.env.DEBUG)

export interface Project {
  root: string
  cleanup: () => Promise<void>
}

const BASE_DIR = join(__dirname, '..', 'base')
const CONFIGS_DIR = join(__dirname, '..', 'configs')

const REACT_VERSIONS: Record<string, string> = {
  '17': '17.0.2',
  '18': '18.3.1',
  '19': '19.0.0',
}

function getCorePath(): string {
  return join(__dirname, '..', '..', '..', '..', 'reference-core')
}

function getWorkspaceRoot(): string {
  return join(__dirname, '..', '..', '..', '..', '..')
}

async function ensureWorkspaceReady(): Promise<void> {
  const corePath = getCorePath()
  const cliBuilt = existsSync(join(corePath, 'dist/cli/index.mjs'))

  if (cliBuilt && !process.env.REF_TEST_FRESH) {
    log.debug('generator', 'Core already built, skipping workspace bootstrap')
    return
  }

  const workspaceRoot = getWorkspaceRoot()
  log.debug('generator', 'Ensuring workspace deps (pnpm install)...')
  await execa('pnpm', ['install'], { cwd: workspaceRoot })
  log.debug('generator', 'Building reference-core...')
  await execa('pnpm', ['run', 'build'], { cwd: corePath })
}

async function ensureSandboxDir(root: string): Promise<void> {
  if (existsSync(root)) {
    await rm(root, { recursive: true, force: true })
  }
  await mkdir(root, { recursive: true })
}

export async function generateSandbox(config: MatrixEntry): Promise<Project> {
  const packageRoot = join(__dirname, '..', '..', '..')
  const sandboxRoot = join(packageRoot, '.sandbox', config.name)

  await ensureWorkspaceReady()

  log.debug('generator', 'Generating sandbox at', sandboxRoot, 'for', config.name)
  await ensureSandboxDir(sandboxRoot)

  log.debug('generator', 'Copying base environment...')
  await cp(BASE_DIR, sandboxRoot, { recursive: true })

  // Override ui.config.ts from configs/{projectName}/ if it exists
  const projectConfigPath = join(CONFIGS_DIR, config.name, 'ui.config.ts')
  if (existsSync(projectConfigPath)) {
    log.debug('generator', 'Using project ui.config from', projectConfigPath)
    await cp(projectConfigPath, join(sandboxRoot, 'ui.config.ts'))
  }

  const corePath = getCorePath()
  const reactVersion = REACT_VERSIONS[config.react] ?? '18.3.1'
  const packageJson = {
    name: `ref-test-sandbox-${config.name}`,
    private: true,
    type: 'module' as const,
    scripts: {
      build: 'vite build',
      dev: 'vite',
      test: 'ref sync && vite build',
    },
    dependencies: {
      react: reactVersion,
      'react-dom': reactVersion,
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
  log.debug('generator', 'Sandbox ready:', config.name)

  return {
    root: sandboxRoot,
    cleanup: async () => {
      await rm(sandboxRoot, { recursive: true, force: true })
    },
  }
}
