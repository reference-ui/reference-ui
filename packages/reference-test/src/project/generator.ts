/**
 * Project generator.
 * Main generateProject(config) - creates complete test project.
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { createTempDirIn, writeFile, removeDir } from '../utils/file-system.js'
import { resolveDependencies } from './dependencies.js'
import { getBundler } from './bundlers/index.js'
import { buildApp } from './app-builder.js'
import type { ProjectConfig, ProjectHandle } from './types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PACKAGE_ROOT = join(__dirname, '../..')
const TEMP_BASE = join(PACKAGE_ROOT, '.temp')

/**
 * Generate a complete test project for the given config.
 * Creates temp dir inside monorepo, package.json, bundler config, app files, ui.config.
 * Uses file: protocol for @reference-ui/core so ref sync can resolve it.
 *
 * @param config - Project configuration (environment, test config variant)
 * @returns Project handle with root path and cleanup function
 */
export async function generateProject(config: ProjectConfig): Promise<ProjectHandle> {
  const rootPath = await createTempDirIn(TEMP_BASE)
  const deps = resolveDependencies(config.environment)
  const bundler = getBundler(config.environment.bundler)

  const pkg: Record<string, unknown> = {
    name: 'reference-test-app',
    private: true,
    type: 'module',
    scripts: {
      build: 'vite build',
      dev: 'vite',
    },
    dependencies: {
      react: deps.react,
      'react-dom': deps.reactDom,
      '@reference-ui/core': 'file:../../../reference-core',
    },
    devDependencies: {
      ...deps.bundler.devDependencies,
      typescript: '~5.9.3',
    },
  }

  await writeFile(join(rootPath, 'package.json'), JSON.stringify(pkg, null, 2))
  const bundlerConfig = bundler.getConfig(config.environment.reactVersion)
  await writeFile(join(rootPath, bundlerConfig.configFilename), bundlerConfig.configContent)
  await buildApp(rootPath, config)

  execSync('pnpm install', { cwd: rootPath, stdio: 'pipe' })

  const cleanup = async (): Promise<void> => {
    await removeDir(rootPath)
  }

  return { rootPath, cleanup }
}
