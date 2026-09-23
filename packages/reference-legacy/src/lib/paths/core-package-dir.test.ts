import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'

const CORE_PACKAGE_NAME = '@reference-ui/core'
const PACKAGE_JSON = 'package.json'

async function importCorePackageDirModule(
  files: string[],
  packageJsons: Record<string, { name: string }>
) {
  vi.resetModules()

  const existingFiles = new Set(files)
  vi.doMock('node:fs', () => ({
    existsSync: (path: string) => existingFiles.has(path),
    readFileSync: (path: string) => JSON.stringify(packageJsons[path]),
  }))

  return import('./core-package-dir')
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('node:fs')
})

describe('resolveCorePackageDir', () => {
  it('finds the nearest @reference-ui/core package when walking up', async () => {
    const coreDir = '/virtual/nearest-core'
    const startDir = '/virtual/nearest-core/src/nested'
    const { resolveCorePackageDir } = await importCorePackageDirModule(
      [`${coreDir}/${PACKAGE_JSON}`],
      { [`${coreDir}/${PACKAGE_JSON}`]: { name: CORE_PACKAGE_NAME } }
    )

    expect(resolveCorePackageDir(startDir)).toBe(coreDir)
  })

  it('falls back to the workspace package when no package root is found first', async () => {
    const workspaceRoot = '/virtual/workspace-fallback'
    const startDir = '/virtual/workspace-fallback/apps/docs/src'
    const workspaceCore = '/virtual/workspace-fallback/packages/reference-core'
    const workspaceFile = `${workspaceRoot}/pnpm-workspace.yaml`
    const workspacePackageJson = `${workspaceCore}/${PACKAGE_JSON}`
    const { resolveCorePackageDir } = await importCorePackageDirModule(
      [workspaceFile, workspacePackageJson],
      { [workspacePackageJson]: { name: CORE_PACKAGE_NAME } }
    )

    expect(resolveCorePackageDir(startDir)).toBe(workspaceCore)
  })

  it('falls back to the installed module package when cwd is a consumer app', async () => {
    const startDir = '/virtual/consumer-app/src'
    const installedPackageJson = fileURLToPath(
      new URL('../../../package.json', import.meta.url)
    )
    const installedCoreDir = installedPackageJson.replace(/\/package\.json$/, '')
    const { resolveCorePackageDir } = await importCorePackageDirModule(
      [installedPackageJson],
      { [installedPackageJson]: { name: CORE_PACKAGE_NAME } }
    )

    expect(resolveCorePackageDir(startDir)).toBe(installedCoreDir)
  })

  it('throws when neither package discovery path succeeds', async () => {
    const startDir = '/virtual/missing/src'
    const { resolveCorePackageDir } = await importCorePackageDirModule([], {})

    expect(() => resolveCorePackageDir(startDir)).toThrowError(
      /package directory could not be resolved/i
    )
  })
})

describe('resolveCorePackageDirForBuild', () => {
  it('prefers the workspace package over a resolved node_modules package', async () => {
    const workspaceRoot = '/virtual/prefer-workspace'
    const nodeModulesCore = '/virtual/prefer-workspace/apps/web/node_modules/@reference-ui/core'
    const startDir = `${nodeModulesCore}/dist`
    const workspaceCore = '/virtual/prefer-workspace/packages/reference-core'
    const workspaceFile = `${workspaceRoot}/pnpm-workspace.yaml`
    const nodeModulesPackageJson = `${nodeModulesCore}/${PACKAGE_JSON}`
    const workspacePackageJson = `${workspaceCore}/${PACKAGE_JSON}`
    const { resolveCorePackageDirForBuild } = await importCorePackageDirModule(
      [workspaceFile, nodeModulesPackageJson, workspacePackageJson],
      {
        [nodeModulesPackageJson]: { name: CORE_PACKAGE_NAME },
        [workspacePackageJson]: { name: CORE_PACKAGE_NAME },
      }
    )

    expect(resolveCorePackageDirForBuild(startDir)).toBe(workspaceCore)
  })

  it('returns the resolved package when no workspace package exists', async () => {
    const coreDir = '/virtual/no-workspace/node_modules/@reference-ui/core'
    const startDir = `${coreDir}/dist`
    const packageJsonPath = `${coreDir}/${PACKAGE_JSON}`
    const { resolveCorePackageDirForBuild } = await importCorePackageDirModule(
      [packageJsonPath],
      { [packageJsonPath]: { name: CORE_PACKAGE_NAME } }
    )

    expect(resolveCorePackageDirForBuild(startDir)).toBe(coreDir)
  })
})
