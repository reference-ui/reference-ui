import { MANAGED_VITE7_DEV_DEPENDENCIES } from '../../../../../../dependencies.js'
import type { MatrixReactRuntime } from '../../../discovery/index.js'
import { getManagedReactProfile } from '../../react/index.js'
import { managedGeneratedNotice, renderManagedTemplate } from '../../template.js'

export const managedVite7DevDependencies = MANAGED_VITE7_DEV_DEPENDENCIES

export function createManagedVite7IndexHtmlSource(options: {
  reactRuntime: MatrixReactRuntime
  title: string
}): string {
  const reactProfile = getManagedReactProfile(options.reactRuntime)

  return renderManagedTemplate(new URL('./templates/index.html.liquid', import.meta.url), {
    generatedNotice: managedGeneratedNotice,
    mountElementId: reactProfile.mountElementId,
    title: options.title,
  })
}

export function createManagedVite7ConfigSource(): string {
  return renderManagedTemplate(new URL('./templates/vite.config.ts.liquid', import.meta.url), {
    generatedNotice: managedGeneratedNotice,
  })
}