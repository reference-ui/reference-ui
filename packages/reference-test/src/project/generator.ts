/**
 * Project generator.
 * Main generateProject(config) - creates complete test project.
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { createProjectDir, writeFile, removeDir } from '../utils/file-system.js'
import { log } from '../lib/log.js'
import { resolveDependencies } from './dependencies.js'
import { getBundler } from './bundlers/index.js'
import { buildApp } from './app-builder.js'
import type { ProjectConfig, ProjectHandle } from './types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PACKAGE_ROOT = join(__dirname, '../..')
const SANDBOX_BASE = join(PACKAGE_ROOT, '.sandbox')

/**
 * Generate a complete test project for the given config.
 * Creates temp dir inside monorepo, package.json, bundler config, app files, ui.config.
 * Uses file: protocol for @reference-ui/core so ref sync can resolve it.
 *
 * @param config - Project configuration (environment, test config variant)
 * @returns Project handle with root path and cleanup function
 */
export async function generateProject(config: ProjectConfig): Promise<ProjectHandle> {
  const { reactVersion, bundler } = config.environment
  const deps = resolveDependencies(config.environment)
  const folderName = `${bundler}-react${reactVersion}`

  log(
    'project',
    'creating project',
    bundler,
    'React',
    reactVersion,
    `(${bundler} ${deps.bundler.version})`,
    '→',
    `.sandbox/${folderName}/`
  )

  const rootPath = await createProjectDir(SANDBOX_BASE, folderName)
  const bundlerImpl = getBundler(config.environment.bundler)

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
      vitest: '^4.0.18',
      playwright: '^1.48.0',
      '@playwright/test': '^1.48.0',
      '@reference-ui/reference-test': 'file:../../../reference-test',
    },
  }

  pkg.scripts = {
    ...(pkg.scripts as Record<string, string>),
    test: 'vitest run',
  }

  await writeFile(join(rootPath, 'package.json'), JSON.stringify(pkg, null, 2))
  const bundlerConfig = bundlerImpl.getConfig(config.environment.reactVersion)
  await writeFile(join(rootPath, bundlerConfig.configFilename), bundlerConfig.configContent)
  await buildApp(rootPath, config)

  await writeFile(
    join(rootPath, 'vitest.config.ts'),
    `import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 60_000,
    teardownTimeout: 10_000,
    pool: 'forks',
  },
  globalTeardown: './tests/teardown.ts',
})
`
  )
  await writeFile(
    join(rootPath, 'tests', 'teardown.ts'),
    `export default function teardown() {
  setTimeout(() => process.exit(0), 500)
}
`
  )

  const templatePath = join(PACKAGE_ROOT, 'src/tests/templates/core-system.test.ts')
  const testContent = readFileSync(templatePath, 'utf-8')
  await writeFile(join(rootPath, 'tests', 'core-system.test.ts'), testContent)

  log('project', 'pnpm install...')
  execSync('pnpm install', { cwd: rootPath, stdio: 'pipe' })
  log('project', 'done', `→ .sandbox/${folderName}/`)

  const cleanup = async (): Promise<void> => {
    await removeDir(rootPath)
  }

  return { rootPath, cleanup }
}
