import {
  MANAGED_REACT_DEPENDENCIES,
  MANAGED_REACT_DEV_DEPENDENCIES,
} from '../../../../../dependencies.js'
import type { MatrixReactRuntime } from '../../discovery/index.js'
import { managedGeneratedNotice, renderManagedTemplate } from '../template.js'

interface ManagedReactProfile {
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  mountApi: 'createRoot' | 'render'
  mountElementId: string
}

export function getManagedReactProfile(runtime: MatrixReactRuntime): ManagedReactProfile {
  return {
    dependencies: { ...MANAGED_REACT_DEPENDENCIES[runtime] },
    devDependencies: { ...MANAGED_REACT_DEV_DEPENDENCIES[runtime] },
    mountApi: runtime === 'react17' ? 'render' : 'createRoot',
    mountElementId: 'root',
  }
}

export function createManagedReactMainSource(options: {
  entryImportPath: string
  runtime: MatrixReactRuntime
}): string {
  const reactProfile = getManagedReactProfile(options.runtime)

  return renderManagedTemplate(new URL('./templates/main.tsx.liquid', import.meta.url), {
    entryImportPath: options.entryImportPath,
    generatedNotice: managedGeneratedNotice,
    mountApi: reactProfile.mountApi,
    mountElementId: reactProfile.mountElementId,
  })
}