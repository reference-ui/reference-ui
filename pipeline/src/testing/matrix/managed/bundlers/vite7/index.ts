import type { MatrixReactRuntime } from '../../../discovery/index.js'
import { getManagedReactProfile } from '../../react/index.js'
import { managedGeneratedNotice, renderManagedTemplate } from '../../template.js'

export const managedVite7DevDependencies = {
  '@vitejs/plugin-react': '^4.7.0',
  vite: '^7.3.1',
} as const

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