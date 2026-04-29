import type { MatrixReactRuntime } from '../../../discovery/index.js'
import { getManagedReactProfile } from '../../react/index.js'
import { managedGeneratedNotice, renderManagedTemplate } from '../../template.js'

export const managedWebpack5DevDependencies = {
  'css-loader': '^7.1.2',
  'html-webpack-plugin': '^5.6.3',
  'style-loader': '^4.0.0',
  'ts-loader': '^9.5.2',
  webpack: '^5.98.0',
  'webpack-cli': '^6.0.1',
  'webpack-dev-server': '^5.2.0',
} as const

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