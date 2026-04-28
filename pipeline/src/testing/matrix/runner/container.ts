/**
 * Dagger container and service helpers for matrix execution.
 */

import { dag } from '@dagger.io/dagger'
import {
  managedRegistryHost,
  managedRegistryPort,
  registryUrlInContainer,
} from '../../../../config.js'
import { matrixNodeImage } from '../node-modules/cache.js'
import type { FixtureSourceFiles } from './types.js'

export function baseNodeContainer(pnpmStoreCacheKey: string, image: string = matrixNodeImage) {
  const pnpmStore = dag.cacheVolume(pnpmStoreCacheKey)
  const container = dag
    .container()
    .from(image)
    .withEnvVariable('CI', '1')
    .withEnvVariable('FORCE_COLOR', '1')
    .withEnvVariable('npm_config_update_notifier', 'false')
    .withEnvVariable('PNPM_HOME', '/pnpm')
    .withEnvVariable('npm_config_store_dir', '/pnpm/store')
    .withMountedCache('/pnpm/store', pnpmStore)
    .withExec(['corepack', 'enable'])

  if (image === matrixNodeImage) {
    return container
      .withExec(['corepack', 'prepare', 'pnpm@10.29.3', '--activate'])
      .withEnvVariable('npm_config_registry', registryUrlInContainer)
  }

  return container
    .withExec(['npm', 'install', '--global', '--force', 'pnpm@10.29.3'])
    .withEnvVariable('npm_config_registry', registryUrlInContainer)
}

export function parsePinnedPlaywrightVersion(versionRange: string | undefined): string {
  const match = versionRange?.match(/\d+\.\d+\.\d+/)

  if (match) {
    return match[0]
  }

  return '1.48.0'
}

export function matrixContainerImage(source: FixtureSourceFiles): string {
  if (!source.hasPlaywrightTests) {
    return matrixNodeImage
  }

  const playwrightVersion = parsePinnedPlaywrightVersion(source.fixturePackageJson.devDependencies?.['@playwright/test'])
  return `mcr.microsoft.com/playwright:v${playwrightVersion}-jammy`
}

export function hostRegistryService() {
  return dag.host().service([{ backend: managedRegistryPort }], {
    host: managedRegistryHost,
  })
}