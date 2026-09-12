/**
 * Dagger container and service helpers for matrix execution.
 */

import { dag } from '@dagger.io/dagger'
import {
  MANAGED_REGISTRY_HOST,
  MANAGED_REGISTRY_PORT,
  REGISTRY_URL_IN_CONTAINER,
} from '../../../../config.js'
import {
  MANAGED_NODE_IMAGE,
  MANAGED_PLAYWRIGHT_VERSION,
  MANAGED_PNPM_VERSION,
  managedPlaywrightContainerImage,
} from '../../../../dependencies.js'
import type { FixtureSourceFiles } from './types.js'

export function baseNodeContainer(pnpmStoreCacheKey: string, image: string = MANAGED_NODE_IMAGE) {
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

  if (image === MANAGED_NODE_IMAGE) {
    return container
      .withExec(['corepack', 'prepare', `pnpm@${MANAGED_PNPM_VERSION}`, '--activate'])
      .withEnvVariable('npm_config_registry', REGISTRY_URL_IN_CONTAINER)
  }

  return container
    .withExec(['npm', 'install', '--global', '--force', `pnpm@${MANAGED_PNPM_VERSION}`])
    .withEnvVariable('npm_config_registry', REGISTRY_URL_IN_CONTAINER)
}

export function parsePinnedPlaywrightVersion(versionRange: string | undefined): string {
  const match = versionRange?.match(/\d+\.\d+\.\d+/)

  if (match) {
    return match[0]
  }

  return MANAGED_PLAYWRIGHT_VERSION
}

export function matrixContainerImage(source: FixtureSourceFiles): string {
  if (!source.hasPlaywrightTests) {
    return MANAGED_NODE_IMAGE
  }

  const playwrightVersion = parsePinnedPlaywrightVersion(source.fixturePackageJson.devDependencies?.['@playwright/test'])
  return managedPlaywrightContainerImage(playwrightVersion)
}

export function hostRegistryService() {
  return dag.host().service([{ backend: MANAGED_REGISTRY_PORT }], {
    host: MANAGED_REGISTRY_HOST,
  })
}