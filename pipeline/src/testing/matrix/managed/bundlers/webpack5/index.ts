import { MANAGED_WEBPACK5_DEV_DEPENDENCIES } from '../../../../../../dependencies.js'
import type { MatrixReactRuntime } from '../../../discovery/index.js'
import { getManagedReactProfile } from '../../react/index.js'
import { managedGeneratedNotice, renderManagedTemplate } from '../../template.js'

export const managedWebpack5DevDependencies = MANAGED_WEBPACK5_DEV_DEPENDENCIES

export function createManagedWebpack5IndexHtmlSource(options: {
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

export function createManagedWebpack5ConfigSource(): string {
  return renderManagedTemplate(new URL('./templates/webpack.config.cjs.liquid', import.meta.url), {
    generatedNotice: managedGeneratedNotice,
  })
}