/**
 * Managed React runtime profiles for matrix fixtures and consumers.
 *
 * Takes a runtime (react17/18/19) and emits pinned dependencies, the mount API,
 * and the generated src/main.tsx entrypoint source. React 17 uses `render`
 * because `createRoot` did not exist yet.
 */
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